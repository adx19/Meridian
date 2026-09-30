"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/app/providers";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import LoginModal from "@/components/LoginModal";

export default function Home() {
	const [open, setOpen] = useState(false);
	const { theme, toggleTheme } = useTheme();
	const { data: session, status } = useSession();
	const router = useRouter();
	const [dots, setDots] = useState("");
	useEffect(() => {
		const interval = setInterval(() => {
			setDots((prev) => {
				if (prev === "...") return "";
				return prev + ".";
			});
		}, 500);

		return () => clearInterval(interval);
	})

	useEffect(() => {
		const checkAIConsent = async () => {

			console.log("Status:", status);
			console.log("Session:", session);
			console.log("UserId:", session?.userId);
			
			if (status != "authenticated") return;

			if(!session?.userId){
				console.error("No userId in session");
				return;
			}

			try {
				const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

				const response = await fetch(`${backendUrl}/auth/ai-settings/${session?.userId}`);

				if (!response.ok) {
					router.replace("/dashboard")
					return;
				}

				const data = await response.json();

				console.log(data)

				if (data.ai_consent) {
					router.replace("/dashboard");
				} else {
					router.replace("/onboarding/ai-consent");
				}

				
				console.log("Calling:", `${backendUrl}/auth/ai-settings/${session?.userId}`);
				console.log("Response:", data);
			} catch (error) {
				console.error(error);

				router.replace("/dashboard");
			}

			
		}

		checkAIConsent();
	}, [status, session ,router]);

	if (status == "loading") {
		return (
			<div className="flex flex-col items-center gap-6">
				<div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center animate-pulse">
					<img src="/meridian-icon.svg" alt="Meridian" className="w-10 h-10" />
				</div>

				<h2 className="text-2xl font-semibold">
					Connecting Meridian
				</h2>

				<div className="flex gap-2">
					<div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
					<div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:150ms]" />
					<div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:300ms]" />
				</div>
			</div>
		);
	}
	return (
		<div className="min-h-screen overflow-hidden text-slate-900 dark:text-zinc-100 transition-colors duration-300">

			{/* background */}
			<div className="fixed inset-0 -z-10">
				{/* grid background overlay */}
				<div className="absolute inset-0 grid-bg opacity-75 dark:opacity-60" />

				{/* subtle premium blur glows */}
				<div className="absolute top-[-300px] left-[10%] w-[700px] h-[700px] bg-indigo-500/10 dark:bg-blue-500/20 blur-[180px] rounded-full transition-colors duration-500" />

				<div className="absolute bottom-[-250px] right-[5%] w-[600px] h-[600px] bg-cyan-500/5 dark:bg-cyan-500/10 blur-[180px] rounded-full transition-colors duration-500" />
			</div>

			{/* NAVBAR */}
			<nav className="fixed top-0 left-0 right-0 z-50">

				<div className="max-w-7xl mx-auto px-6 pt-6">

					<div className="flex items-center justify-between rounded-3xl border border-slate-200/50 dark:border-white/10 bg-white/70 dark:bg-black/40 backdrop-blur-2xl px-6 py-4 shadow-xl shadow-zinc-200/10 dark:shadow-blue-900/5 transition-colors duration-300">

						{/* logo */}
						<div className="flex items-center gap-4">

							<img
								src="/meridian-icon.svg"
								alt="Meridian Logo"
								className="w-11 h-11 rounded-2xl shadow-lg shadow-indigo-500/15 border border-slate-200/50 dark:border-white/10"
								onClick={() => {
									router.replace("/dashboard")
								}}
							/>

							<div>
								<h1 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
									Meridian
								</h1>

								<p className="text-xs font-semibold text-slate-500 dark:text-zinc-500">
									Developer Intelligence
								</p>
							</div>

						</div>

						{/* center links */}
						<div className="hidden md:flex items-center gap-10 text-sm font-medium text-slate-600 dark:text-zinc-400">

							<button
								onClick={() => {
									document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
								}}
								className="hover:text-slate-950 dark:hover:text-white transition-colors"
							>
								Features
							</button>

							<button
								onClick={() => {
									if (session) {
										router.push("/dashboard");
									} else {
										setOpen(true);
									}
								}}
								className="hover:text-slate-950 dark:hover:text-white transition-colors"
							>
								Dashboard
							</button>

							<button
								onClick={() => {
									document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
								}}
								className="hover:text-slate-950 dark:hover:text-white transition-colors"
							>
								Analytics
							</button>

						</div>

						{/* auth & theme toggles */}
						<div className="flex items-center gap-4">
							{/* Theme Toggle */}
							<button
								onClick={toggleTheme}
								className="w-11 h-11 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/[0.02] flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:border-indigo-500/30 hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-all duration-300 shadow-sm"
								title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
							>
								{theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
							</button>

							<button
								onClick={() => setOpen(true)}
								className="bg-slate-950 text-white dark:bg-white dark:text-black px-6 py-2.5 rounded-2xl font-semibold text-sm hover:scale-[1.03] active:scale-[0.98] hover:shadow-lg hover:shadow-indigo-500/10 dark:hover:shadow-none transition-all duration-300"
							>
								Sign In →
							</button>
						</div>

					</div>

				</div>

			</nav>

			{/* HERO */}
			<section className="relative pt-44 pb-32">

				<div className="max-w-7xl mx-auto px-6">

					<div className="grid lg:grid-cols-2 gap-20 items-center">

						{/* LEFT */}
						<motion.div
							initial={{ opacity: 0, y: 40 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.7 }}
						>

							<div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-300 backdrop-blur-xl">

								<div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />

								Developer Memory System

							</div>

							<h1 className="mt-8 text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] text-slate-950 dark:text-white">

								Your repositories
								<span className="block text-slate-400 dark:text-zinc-500 font-medium">
									finally tell
								</span>

								<span className="bg-gradient-to-r from-indigo-500 to-cyan-400 text-transparent bg-clip-text">
									a story.
								</span>

							</h1>

							<p className="mt-8 text-lg leading-relaxed text-slate-600 dark:text-zinc-400 max-w-xl">

								Meridian transforms scattered commits into a visual,
								searchable intelligence layer for developers and teams.

							</p>

							<div className="flex flex-wrap gap-4 mt-10">

								<button
									onClick={() => setOpen(true)}
									className="bg-slate-950 text-white dark:bg-white dark:text-black px-8 py-4 rounded-2xl text-lg font-bold hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 shadow-xl shadow-slate-900/10 dark:shadow-none"
								>
									Start Exploring →
								</button>

								<button
									onClick={() => {
										window.scrollTo({
											top: 1100,
											behavior: "smooth",
										});
									}}
									className="border border-slate-200/80 bg-white/60 dark:border-white/10 dark:bg-white/[0.03] backdrop-blur-xl px-8 py-4 rounded-2xl text-lg font-semibold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-all duration-300"
								>
									View Demo
								</button>

							</div>

							{/* stats */}
							<div className="flex gap-10 mt-16 border-t border-slate-200/50 dark:border-white/5 pt-8">

								<div>
									<h3 className="text-3xl font-bold text-slate-950 dark:text-white">
										89K+
									</h3>

									<p className="text-sm font-medium text-slate-500 dark:text-zinc-500 mt-1">
										Commits analyzed
									</p>
								</div>

								<div>
									<h3 className="text-3xl font-bold text-slate-950 dark:text-white">
										1.2K+
									</h3>

									<p className="text-sm font-medium text-slate-500 dark:text-zinc-500 mt-1">
										Repositories
									</p>
								</div>

								<div>
									<h3 className="text-3xl font-bold text-slate-950 dark:text-white">
										42%
									</h3>

									<p className="text-sm font-medium text-slate-500 dark:text-zinc-500 mt-1">
										Less context loss
									</p>
								</div>

							</div>

						</motion.div>

						{/* RIGHT */}
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.7, delay: 0.2 }}
							className="relative animate-float"
						>

							<div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full" />

							<div className="relative rounded-[32px] border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-black/40 backdrop-blur-2xl overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-indigo-500/5 transition-all duration-300">

								{/* topbar */}
								<div className="flex items-center justify-between border-b border-slate-200/50 dark:border-white/10 px-6 py-4">

									<div className="flex items-center gap-3">

										<div className="w-3 h-3 rounded-full bg-red-400" />
										<div className="w-3 h-3 rounded-full bg-yellow-400" />
										<div className="w-3 h-3 rounded-full bg-green-400" />

									</div>

									<p className="text-xs font-semibold text-slate-400 dark:text-zinc-500">
										Meridian Intelligence
									</p>

								</div>

								<div className="p-6 space-y-5">

									{/* card */}
									<div className="rounded-3xl border border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] p-6 shadow-sm">

										<div className="flex items-start justify-between">

											<div>
												<p className="text-xs font-semibold text-slate-450 dark:text-zinc-500 uppercase tracking-wider">
													Most Active Repository
												</p>

												<h3 className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">
													Football-ML
												</h3>
											</div>

											<div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-xs font-medium">
												+18 commits
											</div>

										</div>

										<div className="mt-7 h-2 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">

											<div className="h-full w-[78%] bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full" />

										</div>

									</div>

									{/* commit */}
									<div className="rounded-3xl border border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] p-6 shadow-sm">

										<div className="flex justify-between items-start gap-4">

											<div>
												<p className="font-bold text-lg text-slate-900 dark:text-white">
													Refactored authentication flow
												</p>

												<p className="text-sm text-slate-500 dark:text-zinc-500 mt-2 leading-relaxed">
													Reduced middleware duplication and improved routing structure.
												</p>
											</div>

											<div className="text-xs font-semibold text-slate-400 dark:text-zinc-500 whitespace-nowrap">
												2h ago
											</div>

										</div>

									</div>

									{/* insight */}
									<div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/[0.05] p-6">

										<p className="text-cyan-600 dark:text-cyan-300 text-sm font-semibold tracking-wider uppercase">
											AI Insight
										</p>

										<p className="mt-3 leading-relaxed text-slate-700 dark:text-zinc-200 text-sm font-medium">
											Your development pattern this week indicates increased backend focus and reduced context switching between repositories.
										</p>

									</div>

								</div>

							</div>

						</motion.div>

					</div>

				</div>

			</section>

			{/* FEATURES */}
			<section id="features" className="relative pb-32 border-t border-slate-200/50 dark:border-white/5 pt-24">

				<div className="max-w-7xl mx-auto px-6">

					<div className="text-center mb-20">

						<p className="text-indigo-650 dark:text-indigo-300 text-sm font-bold uppercase tracking-[0.3em]">
							Platform Features
						</p>

						<h2 className="text-5xl font-bold mt-5 tracking-tight text-slate-950 dark:text-white">
							Everything your
							<span className="text-slate-400 dark:text-zinc-500 font-medium">
								{" "}commits forgot.
							</span>
						</h2>

					</div>

					<div className="grid lg:grid-cols-3 gap-6">

						{/* big card */}
						<div className="lg:col-span-2 rounded-[32px] border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-8 hover:border-indigo-500/25 dark:hover:border-indigo-500/20 transition-all duration-500 shadow-md">

							<p className="text-slate-400 dark:text-zinc-500 text-xs font-bold uppercase tracking-wider">
								Timeline Intelligence
							</p>

							<h3 className="text-3xl font-bold mt-4 text-slate-900 dark:text-white">
								Understand how your projects evolve over time.
							</h3>

							<p className="text-slate-600 dark:text-zinc-400 mt-5 leading-relaxed max-w-2xl text-sm font-medium">
								Meridian converts fragmented commits into structured
								development history with context-aware summaries and
								project timelines.
							</p>

						</div>

						{/* side cards */}
						<div className="space-y-6">

							<div className="rounded-[32px] border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-8 hover:border-cyan-500/25 dark:hover:border-cyan-500/20 transition-all duration-500 shadow-md">

								<p className="text-slate-400 dark:text-zinc-500 text-xs font-bold uppercase tracking-wider">
									AI Summaries
								</p>

								<h3 className="text-2xl font-bold mt-3 text-slate-900 dark:text-white">
									Context-aware commit explanations
								</h3>

							</div>

							<div className="rounded-[32px] border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-8 hover:border-indigo-500/25 dark:hover:border-indigo-500/20 transition-all duration-500 shadow-md">

								<p className="text-slate-400 dark:text-zinc-500 text-xs font-bold uppercase tracking-wider">
									Developer Analytics
								</p>

								<h3 className="text-2xl font-bold mt-3 text-slate-900 dark:text-white">
									Track coding patterns visually
								</h3>

							</div>

						</div>

					</div>

				</div>

			</section>

			{/* CTA */}
			<section className="pb-32">

				<div className="max-w-5xl mx-auto px-6">

					<div className="rounded-[40px] border border-slate-200/60 dark:border-white/10 bg-gradient-to-b from-indigo-500/[0.04] dark:from-indigo-500/[0.08] to-transparent backdrop-blur-2xl p-14 text-center shadow-xl">

						<p className="text-indigo-600 dark:text-indigo-300 uppercase tracking-[0.3em] text-sm font-bold">
							Start Now
						</p>

						<h2 className="text-5xl font-bold mt-6 tracking-tight text-slate-950 dark:text-white">
							Your Git history deserves
							<span className="text-slate-400 dark:text-zinc-500 font-medium">
								{" "}more than commits.
							</span>
						</h2>

						<p className="text-slate-600 dark:text-zinc-400 mt-6 max-w-2xl mx-auto leading-relaxed text-lg font-medium">
							Connect GitHub and transform your repositories into a
							searchable developer memory system.
						</p>

						<button
							onClick={() => setOpen(true)}
							className="mt-10 bg-slate-950 text-white dark:bg-white dark:text-black px-8 py-4 rounded-2xl text-lg font-bold hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 shadow-lg"
						>
							Continue with GitHub →
						</button>

					</div>

				</div>

			</section>

			{/* modal */}
			{open && <LoginModal onClose={() => setOpen(false)} />}

		</div>
	);
}
