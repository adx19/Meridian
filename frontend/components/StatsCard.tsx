interface Props {
	title: string;
	value: string | number;
	subtitle: string;
	accent?: "indigo" | "cyan" | "emerald" | "rose";
}

const accentMap = {
	indigo: "border-l-indigo-400 text-indigo-600 dark:text-indigo-300",
	cyan: "border-l-cyan-400 text-cyan-600 dark:text-cyan-300",
	emerald: "border-l-emerald-400 text-emerald-600 dark:text-emerald-300",
	rose: "border-l-rose-400 text-rose-600 dark:text-rose-300",
};

export default function StatsCard({ title, value, subtitle, accent = "indigo" }: Props) {
	return (
		<div className={`group rounded-xl border border-zinc-200/70 dark:border-white/[0.07] border-l-[3px] ${accentMap[accent]} bg-white/75 dark:bg-white/[0.025] p-5 shadow-sm dark:shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 dark:hover:border-white/[0.13]`}>
			<p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-500">
				{title}
			</p>
			<h2 className="mt-3 truncate text-[23px] font-semibold tracking-[-0.03em] text-zinc-900 dark:text-zinc-100">
				{value}
			</h2>
			<p className="mt-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
				{subtitle}
			</p>
		</div>
	);
}