"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { User, Mail, Calendar, GitBranch, GitCommit, LogOut, Terminal, Layers } from "lucide-react";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function ProfilePage() {
	const { data: session } = useSession();
	const [profileData, setProfileData] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchProfile() {
			if (!session?.userId) return;
			setLoading(true);
			setError(null);

			try {
				const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
				const response = await fetch(`${backendUrl}/auth/profile/${session.userId}`);
				if (!response.ok) {
					throw new Error("Failed to load user profile statistics.");
				}
				const data = await response.json();
				setProfileData(data);
			} catch (err: any) {
				console.error(err);
				setError(err.message || "Could not retrieve user info from the database.");
			} finally {
				setLoading(false);
			}
		}

		fetchProfile();
	}, [session]);

	return (
		<div className="min-h-screen bg-slate-50 dark:bg-[#030712] text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors duration-300">
			{/* background glow decorations */}
			<div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
				<div className="absolute top-[-250px] left-[10%] w-[700px] h-[700px] bg-indigo-500/5 dark:bg-indigo-500/10 blur-[180px] rounded-full" />
				<div className="absolute bottom-[-300px] right-[5%] w-[650px] h-[650px] bg-cyan-500/5 dark:bg-cyan-500/5 blur-[180px] rounded-full" />
				<div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.015)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px]" />
			</div>

			<div className="flex">
				<Sidebar />

				<div className="flex-1 px-8 py-8 h-screen overflow-y-auto">
					<Topbar />

					<div className="max-w-5xl mx-auto mt-10 pb-20">
						{loading ? (
							/* Loading Skeleton */
							<div className="space-y-6 animate-pulse">
								<div className="h-44 rounded-2xl bg-zinc-200 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/5" />
								<div className="grid md:grid-cols-3 gap-6">
									<div className="h-32 rounded-2xl bg-zinc-200 dark:bg-white/[0.02]" />
									<div className="h-32 rounded-2xl bg-zinc-200 dark:bg-white/[0.02]" />
									<div className="h-32 rounded-2xl bg-zinc-200 dark:bg-white/[0.02]" />
								</div>
								<div className="h-80 rounded-2xl bg-zinc-200 dark:bg-white/[0.02]" />
							</div>
						) : error ? (
							/* Error Card */
							<div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 text-center">
								<h2 className="text-lg font-bold text-rose-600 dark:text-rose-400">Error Loading Profile</h2>
								<p className="text-zinc-500 text-xs mt-2">{error}</p>
							</div>
						) : (
							/* Main profile content */
							<motion.div
								initial={{ opacity: 0, y: 15 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.3 }}
								className="space-y-8"
							>
								{/* Header Card */}
								<div className="relative overflow-hidden rounded-2xl border border-zinc-200/60 dark:border-white/5 bg-white dark:bg-[#0c102b]/40 backdrop-blur-3xl p-8 shadow-sm dark:shadow-xl">
									<div className="absolute top-0 right-0 w-44 h-44 bg-indigo-500/5 blur-3xl rounded-full" />
									<div className="flex flex-col md:flex-row items-center gap-6 relative">
										{profileData.avatar_url ? (
											<img
												src={profileData.avatar_url}
												alt={profileData.username}
												className="w-20 h-20 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-lg"
											/>
										) : (
											<div className="w-20 h-20 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-inner">
												<User size={36} />
											</div>
										)}
										<div className="flex-1 text-center md:text-left">
											<h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
												{session?.user?.name || profileData.username}
											</h2>
											<p className="text-indigo-600 dark:text-indigo-400 font-mono text-xs font-semibold mt-1">
												@{profileData.username}
											</p>
											<div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4 text-xs text-zinc-500">
												<span className="flex items-center gap-1.5">
													<Terminal size={14} className="text-zinc-400" />
													GitHub ID: {profileData.github_id}
												</span>
												<span className="flex items-center gap-1.5">
													<Calendar size={14} className="text-zinc-400" />
													Joined: {new Date(profileData.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
												</span>
											</div>
										</div>
										<button
											onClick={() => signOut({ callbackUrl: "/" })}
											className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 rounded-xl transition"
										>
											<LogOut size={14} />
											Sign Out
										</button>
									</div>
								</div>

								{/* Stats Cards */}
								<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
									<div className="rounded-2xl border border-zinc-200/60 dark:border-white/5 bg-white dark:bg-[#0c102b]/40 p-6 shadow-sm dark:shadow-xl">
										<p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Total Repositories</p>
										<div className="flex items-center justify-between mt-4">
											<h3 className="text-3xl font-extrabold text-zinc-950 dark:text-white">{profileData.total_repos}</h3>
											<GitBranch size={22} className="text-indigo-500" />
										</div>
									</div>

									<div className="rounded-2xl border border-zinc-200/60 dark:border-white/5 bg-white dark:bg-[#0c102b]/40 p-6 shadow-sm dark:shadow-xl">
										<p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Total Commits Synced</p>
										<div className="flex items-center justify-between mt-4">
											<h3 className="text-3xl font-extrabold text-zinc-950 dark:text-white">{profileData.total_commits}</h3>
											<GitCommit size={22} className="text-indigo-500" />
										</div>
									</div>

									<div className="rounded-2xl border border-zinc-200/60 dark:border-white/5 bg-white dark:bg-[#0c102b]/40 p-6 shadow-sm dark:shadow-xl">
										<p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Unique Languages</p>
										<div className="flex items-center justify-between mt-4">
											<h3 className="text-3xl font-extrabold text-zinc-950 dark:text-white">{Object.keys(profileData.languages).length}</h3>
											<Layers size={22} className="text-indigo-500" />
										</div>
									</div>
								</div>

								{/* Bottom Grid */}
								<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
									{/* Languages list */}
									<div className="rounded-2xl border border-zinc-200/60 dark:border-white/5 bg-white dark:bg-[#0c102b]/40 p-6 shadow-sm dark:shadow-xl lg:col-span-1">
										<h3 className="text-sm font-bold text-zinc-800 dark:text-white border-b border-zinc-150 dark:border-white/5 pb-3">
											Language Breakdown
										</h3>
										{Object.keys(profileData.languages).length === 0 ? (
											<p className="text-xs text-zinc-500 mt-4 text-center py-4">No languages indexed yet.</p>
										) : (
											<div className="space-y-4.5 mt-5">
												{Object.entries(profileData.languages).map(([lang, count]: any) => (
													<div key={lang}>
														<div className="flex items-center justify-between text-xs font-semibold mb-1.5">
															<span className="text-zinc-700 dark:text-zinc-300">{lang}</span>
															<span className="text-zinc-500">{count} {count === 1 ? 'repo' : 'repos'}</span>
														</div>
														<div className="h-1.5 bg-zinc-100 dark:bg-white/[0.04] rounded-full overflow-hidden">
															<div
																className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
																style={{ width: `${Math.min((count / profileData.total_repos) * 100, 100)}%` }}
															/>
														</div>
													</div>
												))}
											</div>
										)}
									</div>

									{/* Recent activity timeline */}
									<div className="rounded-2xl border border-zinc-200/60 dark:border-white/5 bg-white dark:bg-[#0c102b]/40 p-6 shadow-sm dark:shadow-xl lg:col-span-2">
										<h3 className="text-sm font-bold text-zinc-800 dark:text-white border-b border-zinc-150 dark:border-white/5 pb-3">
											Recent Commits Feed
										</h3>
										{profileData.recent_activity.length === 0 ? (
											<p className="text-xs text-zinc-500 mt-4 text-center py-8">No commit history has been synchronized yet.</p>
										) : (
											<div className="space-y-5 mt-5 relative pl-4 border-l border-zinc-200/60 dark:border-white/5">
												{profileData.recent_activity.map((act: any, idx: number) => (
													<div key={act.sha} className="relative group">
														{/* Timeline Dot */}
														<div className="absolute -left-[20.5px] top-1.5 w-3 h-3 rounded-full bg-indigo-500 dark:bg-indigo-400 ring-4 ring-white dark:ring-[#070b22] group-hover:scale-110 transition duration-150" />
														<div>
															<div className="flex items-center gap-2">
																<span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-[9px] font-semibold">
																	{act.sha.substring(0, 7)}
																</span>
																<span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
																	in {act.repo_name}
																</span>
															</div>
															<p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-1.5 line-clamp-1">
																{act.message}
															</p>
															<p className="text-[10px] text-zinc-400 mt-1">
																{new Date(act.commit_timestamp).toLocaleString()}
															</p>
														</div>
													</div>
												))}
											</div>
										)}
									</div>
								</div>
							</motion.div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
