"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { SessionProvider } from "next-auth/react";

type Theme = "light" | "dark";

type ThemeContextType = {
	theme: Theme;
	toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}

type SearchContextType = {
	searchQuery: string;
	setSearchQuery: (query: string) => void;
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function useSearch() {
	const context = useContext(SearchContext);
	if (!context) {
		throw new Error("useSearch must be used within a SearchProvider");
	}
	return context;
}

export default function Providers({
	children,
}: {
	children: React.ReactNode;
}) {
	const [theme, setTheme] = useState<Theme>("dark");
	const [mounted, setMounted] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		const storedTheme = localStorage.getItem("theme") as Theme | null;
		if (storedTheme) {
			setTheme(storedTheme);
		} else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
			setTheme("light");
		}
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!mounted) return;
		const root = window.document.documentElement;
		if (theme === "light") {
			root.classList.remove("dark");
			root.classList.add("light");
		} else {
			root.classList.remove("light");
			root.classList.add("dark");
		}
		localStorage.setItem("theme", theme);
	}, [theme, mounted]);

	const toggleTheme = () => {
		setTheme((prev) => (prev === "dark" ? "light" : "dark"));
	};

	return (
		<SessionProvider>
			<ThemeContext.Provider value={{ theme, toggleTheme }}>
				<SearchContext.Provider value={{ searchQuery, setSearchQuery }}>
					{children}
				</SearchContext.Provider>
			</ThemeContext.Provider>
		</SessionProvider>
	);
}
