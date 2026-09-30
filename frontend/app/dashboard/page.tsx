"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import StatsCard from "@/components/StatsCard";
import RepoCard from "@/components/RepoCard";
import { useSearch } from "@/app/providers";
import { ChevronLeft, ChevronRight, FolderGit2, Search } from "lucide-react";

/* Ã¢â€â‚¬Ã¢â€â‚¬ helpers Ã¢â€â‚¬Ã¢â€â‚¬ */
function getGreeting() {
	const h = new Date().getHours();
	if (h < 12) return "Good morning";
	if (h < 18) return "Good afternoon";
	return "Good evening";
}

/* Ã¢â€â‚¬Ã¢â€â‚¬ skeleton components Ã¢â€â‚¬Ã¢â€â‚¬ */
function HeroSkeleton() {
	return (
		<div className="mt-7 grid lg:grid-cols-[1.45fr_0.85fr] gap-5 animate-pulse">
			<div className="rounded-2xl border border-zinc-200/70 dark:border-white/[0.07] bg-zinc-100 dark:bg-white/[0.025] p-7 h-56" />
			<div className="rounded-2xl border border-zinc-200/70 dark:border-white/[0.07] bg-zinc-100 dark:bg-white/[0.025] p-6 h-56" />
		</div>
	);
}

function StatsSkeleton() {
	return (
		<div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-5 animate-pulse">
			{[...Array(4)].map((_, i) => (
				<div key={i} className="h-28 rounded-lg border border-zinc-200/70 dark:border-white/[0.07] bg-zinc-100 dark:bg-white/[0.025]" />
			))}
		</div>
	);
}

function ReposSkeleton() {
	return (
		<div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
			{[...Array(6)].map((_, i) => (
				<div key={i} className="h-40 rounded-lg border border-zinc-200/70 dark:border-white/[0.07] bg-zinc-100 dark:bg-white/[0.025]" />
			))}
		</div>
	);
}

export default function DashboardPage() {
	const { data: session } = useSession();
	const { searchQuery } = useSearch();

	const [repos, setRepos] = useState<any[]>([]);
	const [analytics, setAnalytics] = useState<any>({
		total_repos: 0,
		total_commits: 0,
		weekly_commits: 0,
		active_repos: 0,
		most_active_repo: "None",
		most_active_repo_commits: 0,
		context_switching: "Low",
		coding_momentum: "0%",
		commit_quality: "High",
		language_distribution: {}
	});
	const [loading, setLoading] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [languageFilter, setLanguageFilter] = useState("All");

	const repoPerPage = 12;
	// Fast client-side filtering Ã¢â‚¬â€ no extra network requests
	const filteredRepos = useMemo(() => {
		const q = searchQuery.toLowerCase();

		return repos.filter((repo) => {
			const matchesSearch = !searchQuery.trim() || repo.name?.toLowerCase().includes(q) || repo.description?.toLowerCase().includes(q) || repo.language?.toLowerCase().includes(q);

			const matchesLanguage = languageFilter === "All" || repo.language === languageFilter;
			console.log(repo)
			return matchesSearch && matchesLanguage;
		});
	}, [repos, searchQuery, languageFilter]);

	const availableLanguages = useMemo(() => {
		return [
			"All",
			...new Set(
				repos.map((repo) => repo.language).filter(Boolean)
			),
		];
	}, [repos]);
	const totalPages = Math.ceil(filteredRepos.length / repoPerPage);

	const startIndex = (currentPage - 1) * repoPerPage;

	const currentRepos = filteredRepos.slice(
		startIndex, startIndex + repoPerPage
	);

	useEffect(() => {
		setCurrentPage(1);
	}, [searchQuery, languageFilter]);


	useEffect(() => {
		async function loadDashboardData() {
			if (!session?.accessToken || !session?.userId) return;

			const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

			try {
				// 1. Sync and load repositories
				const repoRes = await fetch(
					`${backendUrl}/repository?user_id=${session.userId}`
				);
				if (repoRes.ok) {
					setRepos(await repoRes.json());
				}
			} catch (err) {
				console.error("Failed to load repositories:", err);
			}

			try {
				// 2. Load live database analytics
				const analyticsRes = await fetch(`${backendUrl}/analytics?user_id=${session.userId}`);
				if (analyticsRes.ok) {
					setAnalytics(await analyticsRes.json());
				}
			} catch (err) {
				console.error("Failed to load analytics:", err);
			}

			setLoading(false);
		}

		if (session) {
			loadDashboardData();
		} else if (session === null) {
			// NextAuth resolved with no session
			setLoading(false);
		}
	}, [session]);

	return (
		<div className="min-h-screen bg-slate-50 dark:bg-[#030712] text-zinc-900 dark:text-white transition-colors duration-300 overflow-hidden">

			{/* Ã¢â€â‚¬Ã¢â€â‚¬ ambient background Ã¢â€â‚¬Ã¢â€â‚¬ */}
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
							<StatsSkeleton />
							<div className="mt-16">
								<div className="h-8 w-56 rounded-lg bg-zinc-200 dark:bg-white/[0.04] animate-pulse mb-8" />
								<ReposSkeleton />
							</div>
						</>
					) : (
						<>
							{/* Ã¢â€â‚¬Ã¢â€â‚¬ hero section Ã¢â€â‚¬Ã¢â€â‚¬ */}
							<div className="mt-7 grid lg:grid-cols-[1.45fr_0.85fr] gap-5">

								{/* left hero */}
								<div className="relative overflow-hidden rounded-2xl border border-zinc-200/70 dark:border-white/[0.08] bg-white/80 dark:bg-white/[0.025] backdrop-blur-xl p-7 sm:p-8 shadow-sm dark:shadow-none">
									<div className="absolute top-[-120px] right-[-120px] w-[260px] h-[260px] bg-indigo-500/10 dark:bg-indigo-500/15 blur-[110px] rounded-full" />

									<div className="relative">
										<div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-300">
											<div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
											Live Developer Activity
										</div>

										<h1 className="mt-6 text-3xl sm:text-4xl font-semibold tracking-[-0.04em] leading-[1.08] text-zinc-900 dark:text-white">
											{getGreeting()},
											<span className="block text-zinc-400 dark:text-zinc-500 mt-1">
												{session?.user?.name?.split(" ")[0] || "Developer"}.
											</span>
										</h1>

										<p className="mt-4 text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xl">
											{analytics.total_repos > 0
												? `Meridian has indexed ${analytics.total_repos} ${analytics.total_repos === 1 ? "repository" : "repositories"} and ${analytics.total_commits} commits into your intelligence workspace.`
												: "Sync your GitHub repositories to start tracking commit activity, languages, and coding patterns."}
										</p>

										<div className="flex flex-wrap gap-x-8 gap-y-4 mt-8">
											<div>
												<h3 className="text-xl font-semibold tracking-[-0.03em] text-zinc-900 dark:text-white">
													+{analytics.weekly_commits}
												</h3>
												<p className="text-zinc-500 dark:text-zinc-500 mt-1 text-[11px]">Weekly commits</p>
											</div>
											<div>
												<h3 className="text-xl font-semibold tracking-[-0.03em] text-zinc-900 dark:text-white">
													{analytics.active_repos}
												</h3>
												<p className="text-zinc-500 dark:text-zinc-500 mt-1 text-[11px]">Active repos</p>
											</div>
											<div>
												<h3 className="text-xl font-semibold tracking-[-0.03em] text-zinc-900 dark:text-white">
													{analytics.coding_momentum}
												</h3>
												<p className="text-zinc-500 dark:text-zinc-500 mt-1 text-[11px]">Focus ratio</p>
											</div>
										</div>
									</div>
								</div>

								{/* insight panel */}
								<div className="rounded-2xl border border-indigo-500/15 bg-indigo-500/[0.025] dark:bg-indigo-500/[0.045] backdrop-blur-xl p-6 sm:p-7 shadow-sm dark:shadow-none">
									<p className="text-indigo-600 dark:text-indigo-300 text-[10px] uppercase tracking-[0.14em] font-semibold">
										AI Insight
									</p>

									<h2 className="mt-4 text-[19px] font-semibold tracking-[-0.03em] leading-tight text-zinc-900 dark:text-white">
										{analytics.most_active_repo !== "None"
											? `${analytics.most_active_repo} is your most active repository.`
											: "Sync repos to unlock insights."}
									</h2>

									<p className="mt-3 text-zinc-500 dark:text-zinc-400 text-[12px] leading-relaxed">
										{analytics.most_active_repo_commits > 0
											? `Detected ${analytics.most_active_repo_commits} commits synced across your most active project.`
											: "Connect your repositories to see deep analytics on your development patterns."}
									</p>

									<div className="mt-6 space-y-2.5">
										<div className="rounded-lg border border-zinc-200/70 dark:border-white/[0.07] bg-white/70 dark:bg-white/[0.03] p-3.5">
											<p className="text-zinc-400 dark:text-zinc-500 text-[9px] uppercase tracking-[0.14em] font-semibold">
												Coding Momentum
											</p>
											<h3 className="text-[15px] font-semibold mt-1.5 text-zinc-900 dark:text-white">
												{analytics.coding_momentum} activity ratio
											</h3>
										</div>
										<div className="rounded-lg border border-zinc-200/70 dark:border-white/[0.07] bg-white/70 dark:bg-white/[0.03] p-3.5">
											<p className="text-zinc-400 dark:text-zinc-500 text-[9px] uppercase tracking-[0.14em] font-semibold">
												Commit Quality
											</p>
											<h3 className="text-[15px] font-semibold mt-1.5 text-zinc-900 dark:text-white">
												{analytics.commit_quality} descriptive quality
											</h3>
										</div>
									</div>
								</div>

							</div>

							{/* Ã¢â€â‚¬Ã¢â€â‚¬ stats row Ã¢â€â‚¬Ã¢â€â‚¬ */}
							<div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-5">
								<StatsCard
									title="Most Active Repo"
									value={analytics.most_active_repo}
									subtitle={`+${analytics.most_active_repo_commits} commits total`}
									accent="indigo"
								/>
								<StatsCard
									title="Context Switching"
									value={analytics.context_switching}
									subtitle="Active repositories this week"
									accent="cyan"
								/>
								<StatsCard
									title="Coding Momentum"
									value={analytics.coding_momentum}
									subtitle="Compared to previous week"
									accent="emerald"
								/>
								<StatsCard
									title="Commit Quality"
									value={analytics.commit_quality}
									subtitle="Based on message length"
									accent="rose"
								/>
							</div>

							{/* Ã¢â€â‚¬Ã¢â€â‚¬ repositories section Ã¢â€â‚¬Ã¢â€â‚¬ */}
							<div className="mt-12 pb-16">

								<div className="flex items-end justify-between gap-4 mb-6">
									<div>
										<p className="text-indigo-600 dark:text-indigo-300 text-[10px] uppercase tracking-[0.14em] font-semibold">
											Repositories
										</p>
										<h2 className="text-xl sm:text-3xl font-semibold mt-2 tracking-[-0.04em] text-zinc-900 dark:text-white">
											Your development workspace
										</h2>
									</div>

									<div className="flex items-center gap-3">
										<select value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)} className="h-9 px-3 rounded-lg border border-zinc-300 dark:border-white/[0.1] bg-white dark:bg-white/[0.035] text-zinc-700 dark:text-zinc-200 text-[11px] font-medium hover:border-indigo-500/45 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer">
											{availableLanguages.map((lang) => (
												<option key={lang} value={lang}>{lang}</option>
											))}
										</select>
									</div>
								</div>

								{filteredRepos.length === 0 && repos.length > 0 ? (
									/* Search returned no results */
									<div className="rounded-2xl border border-dashed border-zinc-300 dark:border-white/[0.1] bg-zinc-50/70 dark:bg-white/[0.02] p-10 sm:p-14 text-center">
										<div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
											<Search size={19} className="text-indigo-500" />
										</div>
										<h3 className="text-[15px] font-semibold text-zinc-700 dark:text-zinc-300">
											No repositories matched &quot;{searchQuery}&quot;
										</h3>
										<p className="text-zinc-400 dark:text-zinc-500 text-[12px] mt-2 max-w-xs mx-auto">
											Try a different name, description, or language.
										</p>
									</div>
								) : filteredRepos.length === 0 ? (
									/* No repos synced at all */
									<div className="rounded-2xl border border-dashed border-zinc-300 dark:border-white/[0.1] bg-zinc-50/70 dark:bg-white/[0.02] p-10 sm:p-14 text-center">
										<div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
											<FolderGit2 size={19} className="text-indigo-500" />
										</div>
										<h3 className="text-[15px] font-semibold text-zinc-700 dark:text-zinc-300">
											No repositories synced yet
										</h3>
										<p className="text-zinc-400 dark:text-zinc-500 text-[12px] mt-2 max-w-xs mx-auto">
											GitHub repositories will appear here once the sync completes. This happens automatically on load.
										</p>
									</div>

								) : (
									<>
										<div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
											{currentRepos.map((repo) => (
												<RepoCard
													key={repo.id}
													name={repo.name}
													description={repo.description}
													language={repo.language}
													stars={repo.stars ?? 0}
													last_synced_at={repo.last_synced_at}
												/>
											))}
										</div>
										<div className="flex justify-center items-center gap-2 mt-8">
											<button
												disabled={currentPage === 1}
												onClick={() => setCurrentPage((p) => p - 1)}
												className="
												w-9 h-9
												rounded-lg
												border border-white/10
												bg-white/[0.03]
												disabled:opacity-40
												hover:bg-white/[0.06]
												transition-all
												flex items-center justify-center
											"
											>
												<ChevronLeft size={16} />
											</button>
											{Array.from(
												{ length: totalPages },
												(_, i) => i + 1
											).map((page) => (
												<button
													key={page}
													onClick={() => setCurrentPage(page)}
													className={`w-9 h-9 rounded-lg transition-all ${currentPage === page ? "bg-indigo-600 text-white shadow-sm" : "border border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"}`}
												>
													{page}
												</button>
											))}
											<button
												disabled={currentPage === totalPages}
												onClick={() => setCurrentPage((p) => p + 1)}
												className="
												w-9 h-9
												rounded-lg
												border border-white/10
												bg-white/[0.03]
												disabled:opacity-40
												hover:bg-white/[0.06]
												transition-all
												flex items-center justify-center
											"
											>
												<ChevronRight size={16} />
											</button>
										</div>
									</>

								)}

							</div>

						</>
					)}

				</div>

			</div>
		</div>
	);
}
