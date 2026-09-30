"use client";

import { Search, Sun, Moon, LogOut, User, ChevronDown, X, RefreshCw } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useTheme, useSearch } from "@/app/providers";
import { useRouter } from "next/navigation"

import "dotenv/config"
export default function Topbar() {
	const { data: session } = useSession();
	const { theme, toggleTheme } = useTheme();
	const { searchQuery, setSearchQuery } = useSearch();
	const [syncing, setSyncing] = useState(false)
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const router = useRouter();
	const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
	// Close dropdown when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setDropdownOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const syncRepos = async function () {
		try {
			setSyncing(true)
			await fetch(
				`${backendUrl}/sync/user/${session?.userId}`,
				{
					method: "POST",
				}
			);
			router.refresh();
		} finally {
			setSyncing(false);
		}
	}

	return (
		<div className="flex items-center justify-between gap-5 py-4 border-b border-zinc-200/70 dark:border-white/[0.07] transition-colors duration-200">
			<div>
				<p className="text-zinc-500 dark:text-zinc-500 text-[10px] font-semibold uppercase tracking-[0.14em]">
					Developer Workspace
				</p>
				<h1 className="text-[21px] font-semibold mt-1 tracking-[-0.03em] text-zinc-900 dark:text-zinc-100">
					Your engineering activity,
					<span className="text-indigo-500 dark:text-indigo-400 font-medium">
						{" "}visualized.
					</span>
				</h1>
			</div>

			<div className="flex items-center gap-2 sm:gap-2.5">
				<button disabled={syncing} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] hover:border-indigo-500/30 hover:bg-zinc-50 dark:hover:bg-white/[0.05] transition shadow-sm dark:shadow-none" onClick={syncRepos}>
					<RefreshCw
						size={14}
						className={syncing ? "animate-spin" : ""}
					/>{syncing ? "Syncing..." : "Sync Repositories"}
				</button>
				{/* Search bar */}
				<div className="flex items-center gap-2 sm:gap-2.5 rounded-lg border border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] px-4 py-2 shadow-sm dark:shadow-none transition focus-within:border-indigo-500/40 dark:focus-within:border-indigo-500/30">

					<Search size={16} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
					<input
						id="repo-search"
						placeholder="Search repositories..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="bg-transparent outline-none text-[11px] text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 w-36 md:w-44 focus:w-52 transition-all duration-200"
					/>
					{searchQuery && (
						<button
							onClick={() => setSearchQuery("")}
							className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
							title="Clear search"
						>
							<X size={12} />
						</button>
					)}
				</div>

				{/* Theme Toggle Button */}
				<button
					onClick={toggleTheme}
					className="w-10 h-10 rounded-lg border border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:border-indigo-500/30 transition shadow-sm dark:shadow-none"
					title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
				>
					{theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
				</button>


				{/* Profile Dropdown */}
				{session?.user && (
					<div className="relative" ref={dropdownRef}>
						<button
							onClick={() => setDropdownOpen(!dropdownOpen)}
							className="flex items-center gap-2 p-1.5 rounded-lg border border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] hover:border-indigo-500/30 hover:bg-zinc-50 dark:hover:bg-white/[0.05] transition shadow-sm dark:shadow-none"
						>
							{session.user.image ? (
								<img
									src={session.user.image}
									alt="User Avatar"
									className="w-7 h-7 rounded-lg border border-zinc-200 dark:border-white/10"
								/>
							) : (
								<div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
									<User size={14} />
								</div>
							)}
							<span className="hidden lg:inline text-[11px] font-medium text-zinc-700 dark:text-zinc-300 px-1">
								{session.user.name?.split(" ")[0]}
							</span>
							<ChevronDown size={13} className="text-zinc-400" />
						</button>

						{dropdownOpen && (
							<div className="absolute right-0 mt-2 w-56 rounded-lg border border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c102b] p-2.5 shadow-xl shadow-zinc-200/50 dark:shadow-black/40 z-50 transform origin-top-right transition duration-250">
								<div className="px-3.5 py-2.5 border-b border-zinc-150 dark:border-white/5 mb-2">
									<p className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">
										{session.user.name}
									</p>
									<p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
										@{session.username || "github_user"}
									</p>
								</div>

								<Link
									href="/profile"
									onClick={() => setDropdownOpen(false)}
									className="w-full flex items-center gap-2 sm:gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/[0.05] hover:text-indigo-500 dark:hover:text-indigo-400 transition"
								>
									<User size={14} />
									View Profile
								</Link>

								<button
									onClick={() => {
										setDropdownOpen(false);
										signOut({ callbackUrl: "/" });
									}}
									className="w-full flex items-center gap-2 sm:gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition mt-1"
								>
									<LogOut size={14} />
									Sign Out
								</button>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
