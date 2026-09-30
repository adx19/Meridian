"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTheme } from "@/app/providers";

export default function Loading() {
	let theme = "dark";
	try {
		const themeCtx = useTheme();
		theme = themeCtx?.theme || "dark";
	} catch (e) {
		theme = "dark";
	}

	const [statusIndex, setStatusIndex] = useState(0);
	const statuses = [
		"Initializing engineering intelligence...",
		"Preparing your workspace...",
		"Loading Meridian...",
	];

	useEffect(() => {
		const interval = setInterval(() => {
			setStatusIndex((prev) => (prev + 1) % statuses.length);
		}, 2000);
		return () => clearInterval(interval);
	}, []);

	const isDark = theme === "dark";

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center transition-colors duration-500 bg-[#030514] dark:bg-[#030514] light:bg-[#fafafa]" style={{ backgroundColor: isDark ? "#030514" : "#fafafa" }}>
			{/* background glow decorators */}
			<div className="absolute inset-0 -z-10 overflow-hidden">
				<div 
					className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] blur-[150px] rounded-full transition-colors duration-500" 
					style={{
						background: isDark 
							? "radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(6,182,212,0.05) 100%)" 
							: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, rgba(6,182,212,0.03) 100%)"
					}}
				/>
			</div>

			{/* glass card */}
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.5, ease: "easeOut" }}
				className="flex flex-col items-center gap-6 px-8 py-10 max-w-sm w-[90%] rounded-3xl border shadow-2xl backdrop-blur-2xl transition-all duration-500"
				style={{
					backgroundColor: isDark ? "rgba(255, 255, 255, 0.01)" : "rgba(255, 255, 255, 0.7)",
					borderColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)",
					boxShadow: isDark 
						? "0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)" 
						: "0 25px 50px -12px rgba(0, 0, 0, 0.05)"
				}}
			>
				{/* logo wrapper */}
				<div className="relative">
					<motion.div
						animate={{ 
							boxShadow: isDark
								? ["0 0 20px rgba(99,102,241,0.2)", "0 0 35px rgba(99,102,241,0.4)", "0 0 20px rgba(99,102,241,0.2)"]
								: ["0 0 15px rgba(99,102,241,0.1)", "0 0 25px rgba(99,102,241,0.2)", "0 0 15px rgba(99,102,241,0.1)"]
						}}
						transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
						className="rounded-2xl overflow-hidden border"
						style={{
							borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"
						}}
					>
						<img
							src={isDark ? "/meridian-icon-darkmode.svg" : "/meridian-icon.svg"}
							alt="Meridian Logo"
							className="w-16 h-16 object-cover"
						/>
					</motion.div>
				</div>

				{/* text info */}
				<div className="text-center space-y-2 mt-2 w-full">
					<h3 
						className="text-lg font-bold tracking-tight transition-colors duration-500"
						style={{ color: isDark ? "#ffffff" : "#0f172a" }}
					>
						Meridian
					</h3>
					<div className="h-5 flex items-center justify-center overflow-hidden">
						<motion.p 
							key={statusIndex}
							initial={{ y: 15, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							exit={{ y: -15, opacity: 0 }}
							transition={{ duration: 0.35, ease: "easeOut" }}
							className="text-xs font-semibold tracking-wide transition-colors duration-500"
							style={{ color: isDark ? "rgba(255, 255, 255, 0.4)" : "#64748b" }}
						>
							{statuses[statusIndex]}
						</motion.p>
					</div>
				</div>

				{/* elegant framer motion progress bar */}
				<div 
					className="w-48 h-1 rounded-full overflow-hidden relative mt-2"
					style={{ backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)" }}
				>
					<motion.div
						className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
						initial={{ left: "-100%", width: "40%" }}
						animate={{ left: "100%" }}
						transition={{
							repeat: Infinity,
							duration: 1.6,
							ease: "easeInOut",
						}}
						style={{ position: "absolute" }}
					/>
				</div>
			</motion.div>
		</div>
	);
}
