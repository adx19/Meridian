import Link from "next/link";
import { ArrowUpRight, Clock3, Star } from "lucide-react";

interface Props {
	name: string;
	description: string;
	language: string;
	stars: number;
	last_synced_at: string;
}

function getRelativeTime(dateString: string){
	const diff = Date.now() - new Date(dateString).getTime();
	const minutes = Math.floor(diff / 60000);
	
	if (minutes < 1) return "Just now";
	if (minutes < 60) return `${minutes} min ago`;

	const hours = Math.floor(minutes / 60);
	if(hours < 24) return `${hours} hours ago`;

	const days = Math.floor(hours / 24);
	return `${days} days ago`;
}

export default function RepoCard({ name, description, language, stars, last_synced_at }: Props) {
	return (
		<Link href={`/repo/${name}`} className="group block">
			<div className="relative h-full overflow-hidden rounded-xl border border-zinc-200/70 dark:border-white/[0.07] bg-white/75 dark:bg-white/[0.025] p-5 shadow-sm dark:shadow-none transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-indigo-500/35 group-hover:shadow-md dark:group-hover:bg-white/[0.04]">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-500">Repository</p>
						<h2 className="mt-2 truncate text-[16px] font-semibold tracking-[-0.02em] text-zinc-900 transition-colors group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-300">{name}</h2>
					</div>
					<ArrowUpRight size={16} className="mt-1 shrink-0 text-zinc-400 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-indigo-500" />
				</div>

				<p className="mt-4 min-h-[40px] line-clamp-2 text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-400">
					{description || "No description provided for this repository."}
				</p>

				<div className="mt-5 flex items-center justify-between gap-3 border-t border-zinc-200/70 pt-4 dark:border-white/[0.06]">
					<div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
						<Clock3 size={13} className="text-zinc-400" />
						<span>{getRelativeTime(last_synced_at)}</span>
					</div>
					<div className="flex items-center gap-2.5">
						<span className="rounded-md border border-indigo-500/15 bg-indigo-500/[0.07] px-2 py-1 text-[10px] font-medium text-indigo-600 dark:text-indigo-300">{language || "Code"}</span>
						<span className="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400"><Star size={13} fill="currentColor" />{stars}</span>
					</div>
				</div>
			</div>
		</Link>
	);
}