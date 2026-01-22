import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { STORAGE_KEYS } from "@/constants";

interface ThemeContextValue {
	theme: "light" | "dark" | "auto";
	actualTheme: "light" | "dark";
	setTheme: (theme: "light" | "dark" | "auto") => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const useTheme = () => {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme must be used within ThemeProvider");
	}
	return context;
};

interface ThemeProviderProps {
	children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
	const [theme, setTheme] = useState<"light" | "dark" | "auto">(() => {
		const saved = localStorage.getItem(STORAGE_KEYS.THEME);
		return (saved as "light" | "dark" | "auto") || "auto";
	});

	const [actualTheme, setActualTheme] = useState<"light" | "dark">("light");

	useEffect(() => {
		const updateActualTheme = () => {
			if (theme === "auto") {
				const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
				setActualTheme(prefersDark ? "dark" : "light");
			} else {
				setActualTheme(theme);
			}
		};

		updateActualTheme();

		if (theme === "auto") {
			const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
			mediaQuery.addEventListener("change", updateActualTheme);
			return () => mediaQuery.removeEventListener("change", updateActualTheme);
		}

		return undefined;
	}, [theme]);

	useEffect(() => {
		document.documentElement.classList.toggle("dark", actualTheme === "dark");
		localStorage.setItem(STORAGE_KEYS.THEME, theme);
	}, [theme, actualTheme]);

	const handleSetTheme = (newTheme: "light" | "dark" | "auto") => {
		setTheme(newTheme);
	};

	return (
		<ThemeContext.Provider value={{ theme, actualTheme, setTheme: handleSetTheme }}>
			{children}
		</ThemeContext.Provider>
	);
};
