"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { GitCommit, Star, Code2, RefreshCw, ChevronRight, ChevronLeft, Sparkles, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

/* ── skeleton ── */
function HeroSkeleton() {
	return (
		<div className="mt-7 grid lg:grid-cols-[1.4fr_0.9fr] gap-5 animate-pulse">
			<div className="h-60 rounded-2xl border border-zinc-200/50 dark:border-white/5 bg-zinc-100 dark:bg-white/[0.02]" />
			<div className="h-60 rounded-2xl border border-zinc-200/50 dark:border-white/5 bg-zinc-100 dark:bg-white/[0.02]" />
		</div>
	);
}

function CommitsSkeleton() {
	return (
		<div className="space-y-4 animate-pulse">
			{[...Array(4)].map((_, i) => (
				<div key={i} className="h-24 rounded-xl border border-zinc-200/50 dark:border-white/5 bg-zinc-100 dark:bg-white/[0.02]" />
			))}
		</div>
	);
}

function normalizeList(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
	}

	if (typeof value === "string") {
		return value
			.split(/\n|,|•/)
			.map((item) => item.trim())
			.filter(Boolean);
	}

	return [];
}

function normalizeText(value: unknown, fallback: string): string {
	if (typeof value === "string" && value.trim().length > 0) {
		return value.trim();
	}
	return fallback;
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
	return (
		<div className="rounded-xl border border-zinc-200/60 dark:border-white/10 bg-white dark:bg-white/[0.03] backdrop-blur-2xl p-4 shadow-sm dark:shadow-none">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-zinc-400 dark:text-zinc-500">
						{title}
					</p>
					{subtitle ? (
						<p className="mt-1.5 text-[12px] text-zinc-500 dark:text-zinc-400">{subtitle}</p>
					) : null}
				</div>
			</div>
			<div className="mt-4">{children}</div>
		</div>
	);
}

type ChatMessage = {
	id: string;
	role: "user" | "assistant";
	content: string;
	status?: "pending" | "complete" | "error";
};

export default function RepoPage() {
	const params = useParams();
	const { data: session } = useSession();

	const [commits, setCommits] = useState<any[]>([]);
	const [repoDetails, setRepoDetails] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [syncing, setSyncing] = useState(false);
	const [currentCommitPage, setCurrentCommitPage] = useState(1);
	const [intelligence, setIntelligence] = useState<any>(null);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [chatInput, setChatInput] = useState("");
	const [chatLoading, setChatLoading] = useState(false);
	const pendingMessageIdRef = useRef<string | null>(null);
	const commitsPerPage = 10;
	const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
	const suggestionQuestions = [
		"What changed most recently?",
		"What is the current focus of this repository?",
		"Explain the architecture.",
		"What are the biggest risks?",
	];

	const createMessageId = () => {
		if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
			return crypto.randomUUID();
		}
		return `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	};

	const repoName = String(params.name);

	const totalCommitsPages = Math.ceil(commits.length / commitsPerPage);
	const startIndex = (currentCommitPage - 1) * commitsPerPage;

	const currentCommits = commits.slice(startIndex, startIndex + commitsPerPage);
	const summaryText = normalizeText(intelligence?.summary, repoDetails?.description || "No summary available.");
	const developmentUpdate = normalizeText(
		intelligence?.development_update || intelligence?.recent_work,
		"No development update available."
	);
	const currentFocus = normalizeText(
		intelligence?.project_insights?.current_focus || intelligence?.current_focus,
		"No current focus information available."
	);
	const completedMilestones = normalizeList(intelligence?.project_insights?.completed_milestones || intelligence?.completed_milestones);
	const thingsToReview = normalizeList(intelligence?.project_insights?.potential_risks || intelligence?.potential_risks);
	const nextPriorities = normalizeList(intelligence?.next_priorities || intelligence?.next_steps);
	const technologies = normalizeList(intelligence?.main_technologies || intelligence?.technologies);

	useEffect(() => {
		setCurrentCommitPage(1);
	}, [commits]);


	const handleManualSync = async () => {
		if (!session?.accessToken || !session?.userId || !params.name || syncing) return;

		setSyncing(true);

		try {
			const response = await fetch(`${backendUrl}/commits/sync`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					token: session.accessToken,
					owner: session.username || "",
					repo: params.name as string,
					user_id: session.userId,
				}),
			});
			if (response.ok) {
				const updatedCommits = await response.json();
				setCommits(updatedCommits);
			} else {
				console.error("Failed to manual sync commits: response not ok");
			}
		} catch (err) {
			console.error("Failed to manual sync commits:", err);
		} finally {
			setSyncing(false);
		}
	};

	const sendPrompt = async (prompt: string, clearInput = true) => {
		prompt = prompt.trim();
		if (!prompt || !session?.userId || !repoName || chatLoading) return;

		const userMessage: ChatMessage = {
			id: createMessageId(),
			role: "user",
			content: prompt,
			status: "complete",
		};

		const placeholderMessage: ChatMessage = {
			id: createMessageId(),
			role: "assistant",
			content: "Meridian is analyzing your repository...",
			status: "pending",
		};

		const placeholderId = placeholderMessage.id;
		pendingMessageIdRef.current = placeholderId;

		setMessages((current) => [...current, userMessage, placeholderMessage]);

		if (clearInput) setChatInput("");
		setChatLoading(true);

		console.log("[Repository Chat] request started:", prompt);

		try {
			const response = await fetch(`${backendUrl}/ai/repository-chat`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					repo_name: repoName,
					user_id: session.userId,
					prompt,
				}),
			});

			console.log("[Repository Chat] response status:", response.status);

			if (response.ok) {
				const data = await response.json();
				const assistantMessage: ChatMessage = {
					id: placeholderId,
					role: "assistant",
					content: data.answer || "The repository assistant did not return a response.",
					status: "complete",
				};

				setMessages((current) =>
					current.map((m) => (m.id === placeholderId ? assistantMessage : m)),
				);
			} else {
				console.error("[Repository Chat] request failed:", response.statusText);
				setMessages((current) =>
					current.map((m) =>
						m.id === placeholderId
							? {
									...m,
									content: "I could not retrieve a response from the repository assistant.",
									status: "error",
								}
							: m,
					),
				);
			}
		} catch (err) {
			console.error("[Repository Chat] failed to send request:", err);
			setMessages((current) =>
				current.map((m) =>
					m.id === placeholderId
						? {
								...m,
								content: "An error occurred while communicating with the repository assistant.",
								status: "error",
							}
						: m,
				),
			);
		} finally {
			pendingMessageIdRef.current = null;
			setChatLoading(false);
		}
	};

	const handleSend = () => sendPrompt(chatInput, true);

	useEffect(() => {
		async function loadData() {
			if (!session?.accessToken || !session?.userId || !params.name) return;

			// 1. Fetch repository DB details
			try {
				const res = await fetch(`${backendUrl}/repository/${params.name}?user_id=${session.userId}`);

				if (res.ok) {
					setRepoDetails(await res.json());
				}
			} catch (err) {
				console.error("Failed to load repo details:", err);
			}

			// 2. Fetch repository commits directly from DB
			try {
				const response = await fetch(`${backendUrl}/commits/?repo_name=${params.name}&user_id=${session.userId}`);
				if (response.ok) {
					setCommits(await response.json());
				}
			} catch (err) {
				console.error("Failed to fetch commits from DB:", err);
			}

			try {
				const response = await fetch(`${backendUrl}/intelligence/repository/${params.name}?user_id=${session.userId}`);

				if (response.ok) {
					setIntelligence(await response.json());
				}
			} catch (err) {
				console.error("Failed to load repository Intelligence: ", err);
			}
			setLoading(false);
		}

		if (session) {
			loadData();
		} else if (session === null) {
			setLoading(false);
		}
	}, [session, params.name]);

	return (
		<div className="min-h-screen bg-slate-50 dark:bg-[#030712] text-zinc-900 dark:text-white transition-colors duration-300 overflow-hidden">

			{/* ── ambient background ── */}
			<div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
				<div className="absolute inset-0 bg-slate-50 dark:bg-[#030712] transition-colors duration-300" />
				<div className="absolute top-[-250px] left-[10%] w-[700px] h-[700px] bg-indigo-500/6 dark:bg-indigo-500/10 blur-[180px] rounded-full" />
				<div className="absolute bottom-[-300px] right-[5%] w-[650px] h-[650px] bg-cyan-500/4 dark:bg-cyan-500/5 blur-[180px] rounded-full" />
				<div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px]" />
			</div>

			<div className="flex">

				<Sidebar />

				<div className="flex-1 px-5 sm:px-7 xl:px-8 py-5 h-screen overflow-y-auto">

					<Topbar />

					{loading ? (
						<>
							<HeroSkeleton />
							<div className="mt-12">
								<div className="h-8 w-64 rounded-lg bg-zinc-200 dark:bg-white/[0.04] animate-pulse mb-6" />
								<CommitsSkeleton />
							</div>
						</>
					) : (
						<>
							{/* ── hero ── */}
							<div className="mt-7 grid lg:grid-cols-[1.4fr_0.9fr] gap-5">

								{/* left – repo overview */}
								<div className="relative overflow-hidden rounded-2xl border border-zinc-200/60 dark:border-white/10 bg-white dark:bg-white/[0.03] backdrop-blur-xl p-7 sm:p-8 shadow-sm dark:shadow-none">
									<div className="absolute top-[-120px] right-[-120px] w-[260px] h-[260px] bg-blue-500/10 dark:bg-blue-500/20 blur-[120px] rounded-full" />

									<div className="relative">
										<div className="flex flex-wrap items-center justify-between gap-5">
											<p className="text-indigo-600 dark:text-blue-300 text-[10px] uppercase tracking-[0.18em] font-semibold">
												Repository Intelligence
											</p>
											{session && (
												<button
													onClick={handleManualSync}
													disabled={syncing}
													className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all duration-300 active:scale-95 select-none ${
														syncing
															? "bg-indigo-500/10 border-indigo-500/30 text-indigo-500 cursor-not-allowed animate-pulse"
															: "bg-indigo-500/10 dark:bg-indigo-500/5 border-indigo-500/20 hover:border-indigo-500/50 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300"
													}`}
												>
													<RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
													{syncing ? "Syncing..." : "Sync Commits"}
												</button>
											)}
										</div>

										<h1 className="mt-5 text-3xl sm:text-4xl font-semibold tracking-[-0.04em] leading-[1.05] text-zinc-900 dark:text-white break-all">
											{repoName.toUpperCase()}
										</h1>

										<p className="mt-4 text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl">
											{repoDetails?.description || "No description provided for this repository."}
										</p>

										<div className="flex flex-wrap gap-5 mt-8">
											<div className="flex items-center gap-3">
												<div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center">
													<GitCommit size={16} className="text-indigo-500" />
												</div>
												<div>
													<h3 className="text-xl font-semibold tracking-[-0.02em] text-zinc-900 dark:text-white">{commits.length}</h3>
													<p className="text-zinc-500 dark:text-zinc-500 text-[11px] mt-0.5">Commits synced</p>
												</div>
											</div>
											<div className="flex items-center gap-3">
												<div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
													<Star size={16} className="text-amber-500" />
												</div>
												<div>
													<h3 className="text-xl font-semibold tracking-[-0.02em] text-zinc-900 dark:text-white">{repoDetails?.stars ?? 0}</h3>
													<p className="text-zinc-500 dark:text-zinc-500 text-[11px] mt-0.5">GitHub Stars</p>
												</div>
											</div>
											<div className="flex items-center gap-3">
												<div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center">
													<Code2 size={16} className="text-cyan-500" />
												</div>
												<div>
													<h3 className="text-xl font-semibold tracking-[-0.02em] text-zinc-900 dark:text-white">
														{repoDetails?.language || "Code"}
													</h3>
													<p className="text-zinc-500 dark:text-zinc-500 text-[11px] mt-0.5">Primary Language</p>
												</div>
											</div>
										</div>
									</div>
								</div>

								{/* right – development update */}
								<div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.03] dark:bg-cyan-500/[0.05] backdrop-blur-xl p-6 shadow-sm dark:shadow-none">
									<div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-300">
										<Sparkles size={16} />
										<p className="text-[10px] uppercase tracking-[0.16em] font-semibold">
											Development Update
										</p>
									</div>

									<h2 className="mt-4 text-[17px] font-semibold leading-relaxed text-zinc-900 dark:text-white">
										{loading ? "Generating Repository Intelligence..." : developmentUpdate}
									</h2>

									<div className="mt-6 rounded-xl border border-zinc-200/60 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4">
										<p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-zinc-400 dark:text-zinc-500">
											Repository Overview
										</p>
										<p className="mt-2.5 text-[12px] leading-relaxed text-zinc-600 dark:text-zinc-400 max-w-xl">
											{summaryText}
										</p>
									</div>
								</div>

							</div>
							{/* ── end hero grid ── */}

							{/* ── intelligence sections (2-col) ── */}
							<div className="mt-7 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">

								{/* Left column — AI Insights */}
								<div className="space-y-4">
									<SectionCard
										title="AI Insights"
										subtitle="What matters most right now"
									>
										<div className="space-y-4">
											<div className="rounded-xl border border-zinc-200/60 dark:border-white/10 bg-zinc-50/80 dark:bg-white/[0.02] p-4">
												<div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
													<Sparkles size={16} />
													<p className="text-[12px] font-semibold">Current Focus</p>
												</div>
												<p className="mt-2.5 text-[12px] leading-relaxed text-zinc-600 dark:text-zinc-400">
													{currentFocus}
												</p>
											</div>

											<div className="rounded-xl border border-zinc-200/60 dark:border-white/10 bg-zinc-50/80 dark:bg-white/[0.02] p-4">
												<div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
													<CheckCircle2 size={16} />
													<p className="text-[12px] font-semibold">Completed Milestones</p>
												</div>
												{completedMilestones.length > 0 ? (
													<ul className="mt-3 space-y-2">
														{completedMilestones.map((item, index) => (
															<li key={`${item}-${index}`} className="flex gap-2 text-[12px] text-zinc-600 dark:text-zinc-400">
																<CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
																<span>{item}</span>
															</li>
														))}
													</ul>
												) : (
													<p className="mt-2.5 text-[12px] text-zinc-500 dark:text-zinc-400">No information available.</p>
												)}
											</div>

											<div className="rounded-xl border border-zinc-200/60 dark:border-white/10 bg-zinc-50/80 dark:bg-white/[0.02] p-4">
												<div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
													<AlertCircle size={16} />
													<p className="text-[12px] font-semibold">Things to Review</p>
												</div>
												{thingsToReview.length > 0 ? (
													<ul className="mt-3 space-y-2">
														{thingsToReview.map((item, index) => (
															<li key={`${item}-${index}`} className="flex gap-2 text-[12px] text-zinc-600 dark:text-zinc-400">
																<AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-500" />
																<span>{item}</span>
															</li>
														))}
													</ul>
												) : (
													<p className="mt-2.5 text-[12px] text-zinc-500 dark:text-zinc-400">No information available.</p>
												)}
											</div>
										</div>
									</SectionCard>
								</div>

								{/* Right column — Suggested Next Steps + Technologies */}
								<div className="space-y-4">
									<SectionCard title="Suggested Next Steps" subtitle="A concise path forward">
										{nextPriorities.length > 0 ? (
											<ol className="space-y-2.5">
												{nextPriorities.map((item, index) => (
													<li key={`${item}-${index}`} className="flex gap-3 rounded-xl border border-zinc-200/60 dark:border-white/10 bg-zinc-50/70 dark:bg-white/[0.02] p-4">
														<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-[12px] font-semibold text-indigo-600 dark:text-indigo-300">
															{index + 1}
														</div>
														<p className="text-[12px] leading-relaxed text-zinc-600 dark:text-zinc-400">{item}</p>
													</li>
												))}
											</ol>
										) : (
											<p className="text-sm text-zinc-500 dark:text-zinc-400">No information available.</p>
										)}
									</SectionCard>

									<SectionCard title="Technologies" subtitle="Main stack and implementation focus">
										{technologies.length > 0 ? (
											<div className="flex flex-wrap gap-1.5">
												{technologies.map((tech, index) => (
													<span
														key={`${tech}-${index}`}
														className="inline-flex items-center rounded-full border border-zinc-200/70 bg-white/80 px-2.5 py-1 text-[12px] text-zinc-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300"
													>
														{tech}
													</span>
												))}
											</div>
										) : (
											<p className="text-sm text-zinc-500 dark:text-zinc-400">No information available.</p>
										)}
									</SectionCard>
								</div>

							</div>
							{/* ── end intelligence grid ── */}

							{/* ── Repository Chat (full-width) ── */}
							<div className="mt-8">
								<div className="overflow-hidden rounded-2xl border border-indigo-500/20 bg-slate-950 shadow-[0_20px_80px_rgba(99,102,241,0.09)] ring-1 ring-indigo-500/10">

									{/* Chat header */}
									<div className="flex items-center gap-3 border-b border-white/[0.07] bg-indigo-500/[0.05] px-6 py-4">
										<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15">
											<Sparkles size={17} className="text-indigo-300" />
										</div>
										<div>
											<p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-indigo-300">
												Repository Chat
											</p>
											<p className="mt-0.5 text-[12px] text-zinc-400">
												Ask Meridian anything about this repository
											</p>
										</div>
									</div>

									{/* Message area */}
									<div className="min-h-[280px] max-h-[420px] overflow-y-auto p-5 space-y-4">
										{messages.length > 0 ? (
											messages.map((message) => {
												const isUser = message.role === "user";
												const isPending = message.status === "pending";
												const isError = message.status === "error";
												return (
													<div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
														<div
															className={`max-w-[85%] rounded-2xl border px-4 py-3 text-sm leading-6 ${
																isUser
																	? "rounded-br-sm bg-indigo-500/20 border-indigo-500/30 text-white"
																	: isError
																	? "rounded-bl-sm bg-red-500/10 border-red-500/20 text-red-200"
																	: "rounded-bl-sm bg-white/[0.04] border-white/10 text-zinc-100"
															} ${isPending ? "animate-pulse" : ""}`}
														>
															<div className="flex items-center gap-2 mb-1.5">
																<p
																	className={`text-[10px] uppercase tracking-[0.22em] font-semibold ${
																		isUser
																			? "text-indigo-300"
																			: isError
																			? "text-red-300"
																			: "text-cyan-300"
																	}`}
																>
																	{isUser ? "You" : "Meridian"}
																</p>
																{isPending && (
																	<span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] text-cyan-300">
																		Analyzing
																	</span>
																)}
																{isError && (
																	<span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] text-red-300">
																		Error
																	</span>
																)}
															</div>
															<p className="whitespace-pre-line">{message.content}</p>
														</div>
													</div>
												);
											})
										) : (
											<div className="flex h-full items-center justify-center py-10 text-center">
												<div>
													<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10">
														<Sparkles size={22} className="text-indigo-400" />
													</div>
													<p className="text-[13px] text-zinc-400 max-w-xs mx-auto">
														Ask a question about this repository and Meridian will answer using the available project context.
													</p>
												</div>
											</div>
										)}
									</div>

									{/* Suggested Questions */}
									<div className="border-t border-white/[0.05] bg-white/[0.01] px-5 py-3">
										<p className="mb-2.5 text-[10px] uppercase tracking-[0.18em] font-semibold text-zinc-500">
											Suggested Questions
										</p>
										<div className="flex flex-wrap gap-2">
											{suggestionQuestions.map((q) => (
												<button
													key={q}
													id={`suggestion-${q.replace(/\s+/g, "-").toLowerCase()}`}
													type="button"
													onClick={() => {
														if (!chatLoading) sendPrompt(q, true);
													}}
													disabled={chatLoading}
													className="rounded-full border border-indigo-500/20 bg-indigo-500/[0.06] px-3 py-1.5 text-[12px] text-indigo-200 transition hover:border-indigo-500/40 hover:bg-indigo-500/15 disabled:opacity-40 disabled:cursor-not-allowed"
												>
													{q}
												</button>
											))}
										</div>
									</div>

									{/* Composer */}
									<div className="border-t border-white/[0.05] px-5 pb-5 pt-4">
										<div className="flex gap-3">
											<textarea
												id="repo-chat-input"
												rows={2}
												value={chatInput}
												onChange={(event) => setChatInput(event.target.value)}
												onKeyDown={(event) => {
													if (event.key === "Enter" && !event.shiftKey) {
														event.preventDefault();
														handleSend();
													}
												}}
												placeholder="Ask Meridian about this repository..."
												className="flex-1 min-h-[72px] resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
											/>
											<button
												type="button"
												id="repo-chat-send-btn"
												onClick={handleSend}
												disabled={chatLoading || !chatInput.trim()}
												className={`self-end inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
													chatLoading || !chatInput.trim()
														? "cursor-not-allowed border border-white/10 bg-white/[0.04] text-zinc-500"
														: "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/25 active:scale-95"
												}`}
											>
												<ArrowRight size={15} />
												{chatLoading ? "Sending..." : "Send"}
											</button>
										</div>
									</div>

								</div>
							</div>
							{/* ── end Repository Chat ── */}

							{/* ── commit timeline ── */}
							<div className="mt-12 pb-20">

								<div className="flex items-end justify-between mb-6">
									<div>
										<p className="text-indigo-600 dark:text-blue-300 text-[10px] uppercase tracking-[0.16em] font-semibold">
											Commit Timeline
										</p>
										<h2 className="text-2xl sm:text-3xl font-semibold mt-2 tracking-[-0.03em] text-zinc-900 dark:text-white">
											Recent development activity
										</h2>
									</div>
									<p className="text-zinc-500 dark:text-zinc-500 max-w-xs text-right text-[12px]">
										Explore commit flow, architecture decisions, and repository evolution.
									</p>
								</div>

								{commits.length === 0 ? (
									<div className="rounded-2xl border border-dashed border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.02] p-12 text-center">
										<div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-3">
											<GitCommit size={20} className="text-indigo-400" />
										</div>
										<h3 className="text-[15px] font-semibold text-zinc-700 dark:text-zinc-300">
											No commits synced yet
										</h3>
										<p className="text-zinc-400 dark:text-zinc-500 text-[12px] mt-2 max-w-xs mx-auto">
											Commits will appear here once the repository sync completes or the repo has commit history on GitHub.
										</p>
									</div>
								) : (
									<>
										<div className="space-y-4">
											{currentCommits.map((commit) => (
												<div
													key={commit.sha}
													className="group relative overflow-hidden rounded-xl border border-zinc-200/60 dark:border-white/10 bg-white dark:bg-white/[0.03] backdrop-blur-2xl p-4 hover:border-indigo-500/30 dark:hover:border-indigo-500/20 transition-all duration-500 shadow-sm dark:shadow-none"
												>
													<div className="absolute top-[-60px] right-[-60px] w-[130px] h-[130px] bg-indigo-500/5 dark:bg-blue-500/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition duration-500" />

													<div className="relative flex items-start justify-between gap-5">

														<div className="flex-1 min-w-0">
															{/* badge */}
															<div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/8 dark:bg-indigo-500/10 px-2.5 py-1 text-[11px] text-indigo-600 dark:text-indigo-300 mb-3 font-mono">
																{commit.sha?.substring(0, 7)}
															</div>

															<h3 className="text-[15px] font-semibold tracking-tight leading-snug text-zinc-900 dark:text-white line-clamp-2">
																{commit.message}
															</h3>

															<p className="mt-2 text-zinc-500 dark:text-zinc-400 font-mono text-[11px] leading-relaxed">
																<span className="text-emerald-600 dark:text-emerald-400">+{commit.insertions ?? 0}</span>
																{" "}additions,{" "}
																<span className="text-rose-600 dark:text-rose-400">-{commit.deletions ?? 0}</span>
																{" "}deletions across{" "}
																<span className="text-zinc-700 dark:text-zinc-300 font-semibold">{commit.files_changed ?? 0}</span>
																{" "}files.
															</p>
														</div>

														<div className="text-right shrink-0">
															<p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">
																Author
															</p>
															<h4 className="mt-1.5 text-[12px] font-semibold text-zinc-800 dark:text-zinc-200">
																{commit.author_name}
															</h4>
															<p className="mt-2 text-[10px] text-zinc-400">
																{new Date(commit.commit_timestamp).toLocaleDateString(undefined, {
																	year: "numeric",
																	month: "short",
																	day: "numeric",
																})}
															</p>
														</div>

													</div>
												</div>
											))}
										</div>
										<div className="flex justify-center items-center gap-2 mt-8">
											<button
												disabled={currentCommitPage === 1}
												onClick={() => setCurrentCommitPage((p) => p - 1)}
												className="w-9 h-9 rounded-lg border border-white/10 bg-white/[0.03] disabled:opacity-40 hover:bg-white/[0.06] transition-all flex items-center justify-center"
											>
												<ChevronLeft size={16} />
											</button>
											{Array.from(
												{ length: totalCommitsPages },
												(_, i) => i + 1,
											).map((page) => (
												<button
													key={page}
													onClick={() => setCurrentCommitPage(page)}
													className={`w-9 h-9 rounded-lg transition-all ${
														currentCommitPage === page
															? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
															: "border border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
													}`}
												>
													{page}
												</button>
											))}
											<button
												disabled={currentCommitPage === totalCommitsPages}
												onClick={() => setCurrentCommitPage((p) => p + 1)}
												className="w-9 h-9 rounded-lg border border-white/10 bg-white/[0.03] disabled:opacity-40 hover:bg-white/[0.06] transition-all flex items-center justify-center"
											>
												<ChevronRight size={16} />
											</button>
										</div>
									</>
								)}

							</div>
							{/* ── end commit timeline ── */}

						</>
					)}

				</div>

			</div>
		</div>
	);
}
