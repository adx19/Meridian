"use client";

import { motion } from "framer-motion";
import { signIn } from "next-auth/react";

export default function LoginModal({
	onClose,
}: {
	onClose: () => void;
}) {
	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-2xl"
			onClick={onClose}
		>
			{/* glow */}
			<div className="absolute w-[700px] h-[700px] bg-blue-500/20 blur-[180px] rounded-full" />

			<motion.div
				initial={{ opacity: 0, scale: 0.92, y: 20 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				transition={{ duration: 0.35 }}
				onClick={(e) => e.stopPropagation()}
				className="relative w-[470px] overflow-hidden rounded-[32px] border border-white/10 bg-[#050816]/95 shadow-2xl"
			>
				{/* top gradient */}
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.20),transparent_60%)]" />

				<div className="relative p-8">
					{/* top row */}
					<div className="flex items-start justify-between">
						<div>
							<div className="inline-flex items-center gap-2 border border-blue-500/20 bg-blue-500/10 px-3 py-1 rounded-full text-xs text-blue-300 mb-5">
								Secure GitHub Authentication
							</div>

							<h2 className="text-4xl font-semibold tracking-tight text-white">
								Welcome back
							</h2>

							<p className="text-zinc-400 mt-3 leading-relaxed">
								Continue to Meridian and analyze your repositories,
								commits, and engineering patterns.
							</p>
						</div>

						<button
							onClick={onClose}
							className="text-zinc-500 hover:text-white transition text-xl"
						>
							×
						</button>
					</div>

					{/* github button */}
					<button
						onClick={() =>
							signIn("github", {
								callbackUrl: "/",
							})
						}
						className="mt-8 w-full group relative overflow-hidden rounded-2xl border border-white/10 bg-white text-black py-4 px-5 hover:scale-[1.02] transition-all duration-300"
					>
						<div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-400/20 opacity-0 group-hover:opacity-100 transition duration-300" />

						<div className="relative flex items-center justify-center gap-3 font-medium text-lg">
							<img
								src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
								className="w-6 h-6"
							/>

							<span>Continue with GitHub</span>
						</div>
					</button>

					{/* divider */}
					<div className="flex items-center gap-4 my-8">
						<div className="flex-1 h-px bg-white/10" />

						<span className="text-xs uppercase tracking-[0.3em] text-zinc-500">
							Developer Intelligence
						</span>

						<div className="flex-1 h-px bg-white/10" />
					</div>

					{/* cards */}
					<div className="space-y-4">
						<div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
							<div className="flex items-start gap-4">
								<div className="w-11 h-11 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 text-xl">
									⚡
								</div>

								<div>
									<h3 className="font-medium text-white text-lg">
										AI-Powered Commit Insights
									</h3>

									<p className="text-zinc-400 text-sm mt-2 leading-relaxed">
										Understand what changed without reading every
										diff manually.
									</p>
								</div>
							</div>
						</div>

						<div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.05] p-5">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-cyan-300 text-sm">
										Connected Repositories
									</p>

									<h3 className="text-3xl font-semibold mt-1">
										24+
									</h3>
								</div>

								<div className="w-14 h-14 rounded-2xl bg-cyan-400/10 flex items-center justify-center text-2xl">
									🚀
								</div>
							</div>
						</div>
					</div>

					{/* footer */}
					<div className="mt-8 flex items-center justify-between text-xs text-zinc-500">
						<p>Meridian © 2026</p>

						<div className="flex items-center gap-2">
							<div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />

							<span>OAuth Active</span>
						</div>
					</div>
				</div>
			</motion.div>
		</div>
	);
}
