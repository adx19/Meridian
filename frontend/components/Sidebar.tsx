"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, User } from "lucide-react";
import { useTheme } from "@/app/providers";


const items = [
	{
		label: "Dashboard",
		icon: LayoutDashboard,
		path: "/dashboard",
	},
	{
		label: "My Profile",
		icon: User,
		path: "/profile",
	},
];

export default function Sidebar() {
	const pathname = usePathname();
	const { theme } = useTheme();

	return (
		<div className="w-[270px] min-h-screen border-r border-zinc-200/50 dark:border-white/5 bg-[#fafafa] dark:bg-[#060a1f]/45 backdrop-blur-3xl px-6 py-8 transition-colors duration-300">
			{/* logo */}
			<div className="flex items-center gap-3 px-2 mb-10">
				<img 
					src= "/meridian-icon.svg"
					alt="Meridian Logo" 
					className="w-9 h-9 rounded-[10px] border border-zinc-200/80 dark:border-white/10 shadow-sm"
				/>
				<div>
					<h1 className="text-[15px] font-semibold tracking-[-0.02em] text-zinc-950 dark:text-zinc-100">
						Meridian
					</h1>
					<p className="text-[10px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400/80 font-bold">
						Dev Intelligence
					</p>
				</div>
			</div>

			{/* nav */}
			<div className="space-y-1">
				{items.map((item) => {
					const Icon = item.icon;
					const isActive = pathname === item.path;

					return (
						<Link
							key={item.label}
							href={item.path}
							className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 border ${
								isActive
									? "bg-indigo-500/10 dark:bg-indigo-400/[0.1] border-indigo-500/20 dark:border-indigo-400/20 text-indigo-700 dark:text-indigo-300 shadow-[inset_2px_0_0_#818cf8]"
									: "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/55 dark:hover:bg-white/[0.045] border-transparent"
							}`}
						>
							<Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} className="transition-transform duration-200 group-hover:scale-105" />
							<span className="font-medium text-[12px] tracking-[-0.01em]">
								{item.label}
							</span>
						</Link>
					);
				})}
			</div>

			{/* bottom panel */}
			<div className="mt-16 rounded-xl border border-zinc-200/70 dark:border-white/[0.07] bg-white/70 dark:bg-white/[0.025] p-4 shadow-sm dark:shadow-none">
				<p className="text-indigo-600 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
					Platform Status
				</p>
				<h3 className="text-xs font-semibold mt-3 leading-snug text-zinc-800 dark:text-zinc-200">
					All ingestion engines active.
				</h3>
				<p className="text-zinc-500 dark:text-zinc-500 text-[11px] mt-2 leading-relaxed">
					Database, OAuth callbacks, and commit detailed diff indexers are fully operational.
				</p>
			</div>
		</div>
	);
}
