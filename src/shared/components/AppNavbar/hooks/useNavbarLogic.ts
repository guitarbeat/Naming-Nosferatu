import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEYS } from "../../../../core/constants";
import { useCollapsible } from "../../../../core/hooks/useStorage";

// --- useNavbarCollapse ---
export function useNavbarCollapse(defaultCollapsed = false) {
	const { isCollapsed, toggleCollapsed } = useCollapsible(
		STORAGE_KEYS.NAVBAR_COLLAPSED,
		defaultCollapsed,
	);
	return { isCollapsed, toggle: toggleCollapsed };
}

// --- useMobileMenu ---
export const useMobileMenu = () => {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	const toggleMobileMenu = useCallback(() => {
		setIsMobileMenuOpen((prev) => !prev);
	}, []);

	const closeMobileMenu = useCallback(() => {
		setIsMobileMenuOpen(false);
	}, []);

	useEffect(() => {
		const handleEscapeKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				closeMobileMenu();
			}
		};

		if (isMobileMenuOpen) {
			document.addEventListener("keydown", handleEscapeKey);
			// Prevent scrolling when menu is open
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}

		return () => {
			document.removeEventListener("keydown", handleEscapeKey);
			document.body.style.overflow = "";
		};
	}, [isMobileMenuOpen, closeMobileMenu]);

	return {
		isMobileMenuOpen,
		toggleMobileMenu,
		closeMobileMenu,
	};
};

// --- useAnalysisMode ---
const ANALYSIS_QUERY_PARAM = "analysis";

export const useAnalysisMode = () => {
	const [isAnalysisMode, setIsAnalysisMode] = useState(false);

	const checkAnalysisModeFromUrl = useCallback(() => {
		if (typeof window === "undefined") return;
		const params = new URLSearchParams(window.location.search);
		const isAnalysis = params.get(ANALYSIS_QUERY_PARAM) === "true";
		if (isAnalysis !== isAnalysisMode) {
			setIsAnalysisMode(isAnalysis);
		}
	}, [isAnalysisMode]);

	useEffect(() => {
		checkAnalysisModeFromUrl();
		window.addEventListener("popstate", checkAnalysisModeFromUrl);
		return () =>
			window.removeEventListener("popstate", checkAnalysisModeFromUrl);
	}, [checkAnalysisModeFromUrl]);

	return { isAnalysisMode, setIsAnalysisMode };
};

export const useToggleAnalysis = (
	isAnalysisMode: boolean,
	setIsAnalysisMode: (val: boolean) => void,
) => {
	const toggleAnalysis = useCallback(() => {
		const newMode = !isAnalysisMode;
		setIsAnalysisMode(newMode);

		if (typeof window !== "undefined") {
			const url = new URL(window.location.href);
			if (newMode) {
				url.searchParams.set(ANALYSIS_QUERY_PARAM, "true");
			} else {
				url.searchParams.delete(ANALYSIS_QUERY_PARAM);
			}
			window.history.pushState({}, "", url.toString());
		}
	}, [isAnalysisMode, setIsAnalysisMode]);

	return toggleAnalysis;
};
