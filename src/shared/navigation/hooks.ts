/**
 * @module hooks
 * @description Navigation-related React hooks for state management and side effects
 */

import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEYS } from "../../core/constants";
import { useCollapsible } from "../../core/hooks/useStorage";

// ============================================================================
// Navbar Collapse Hook
// ============================================================================

/**
 * Hook for managing navbar collapse state with localStorage persistence
 * @param defaultCollapsed - Default collapsed state
 * @returns Object with isCollapsed state and toggle function
 */
export function useNavbarCollapse(defaultCollapsed = false) {
	const { isCollapsed, toggleCollapsed } = useCollapsible(
		STORAGE_KEYS.NAVBAR_COLLAPSED,
		defaultCollapsed,
	);
	return { isCollapsed, toggle: toggleCollapsed };
}

// ============================================================================
// Mobile Menu Hook
// ============================================================================

/**
 * Hook for managing mobile menu state with keyboard and scroll handling
 * @returns Object with mobile menu state and control functions
 */
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

// ============================================================================
// Analysis Mode Hooks
// ============================================================================

const ANALYSIS_QUERY_PARAM = "analysis";

/**
 * Hook for managing analysis mode state synchronized with URL parameters
 * @returns Object with analysis mode state and setter
 */
export const useAnalysisMode = () => {
	const [isAnalysisMode, setIsAnalysisMode] = useState(false);

	const checkAnalysisModeFromUrl = useCallback(() => {
		if (typeof window === "undefined") {
			return;
		}
		const params = new URLSearchParams(window.location.search);
		const isAnalysis = params.get(ANALYSIS_QUERY_PARAM) === "true";
		setIsAnalysisMode((prev) => {
			if (isAnalysis !== prev) {
				return isAnalysis;
			}
			return prev;
		});
	}, []);

	useEffect(() => {
		checkAnalysisModeFromUrl();
		window.addEventListener("popstate", checkAnalysisModeFromUrl);
		return () => window.removeEventListener("popstate", checkAnalysisModeFromUrl);
	}, [checkAnalysisModeFromUrl]);

	return { isAnalysisMode, setIsAnalysisMode };
};

/**
 * Hook for toggling analysis mode with URL parameter synchronization
 * @param isAnalysisMode - Current analysis mode state
 * @param setIsAnalysisMode - Function to update analysis mode state
 * @returns Toggle function for analysis mode
 */
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

// ============================================================================
// Navbar Dimensions Hook
// ============================================================================

export interface NavbarDimensions {
	width: number;
	height: number;
}

/**
 * Hook for tracking navbar dimensions and updating CSS variables
 * @param _isCollapsed - Collapsed state (triggers dimension recalculation)
 * @returns Current navbar dimensions
 */
export const useNavbarDimensions = (_isCollapsed: boolean) => {
	const [dimensions, setDimensions] = useState<NavbarDimensions>({
		width: 0,
		height: 0,
	});

	const updateDimensions = useCallback(() => {
		if (typeof window === "undefined") {
			return;
		}

		const navbarElement = document.getElementById("app-navbar");
		if (navbarElement) {
			const rect = navbarElement.getBoundingClientRect();
			setDimensions({
				width: rect.width,
				height: rect.height,
			});

			// Update CSS variable for the rest of the app to use
			document.documentElement.style.setProperty("--navbar-height", `${rect.height}px`);
			document.documentElement.style.setProperty("--navbar-width", `${rect.width}px`);
		}
	}, []);

	useEffect(() => {
		updateDimensions();
		// Also update after transition ends (duration-slower is 500ms, add buffer)
		const timeout = setTimeout(updateDimensions, 600);

		const handleResize = () => {
			updateDimensions();
		};

		window.addEventListener("resize", handleResize);
		return () => {
			window.removeEventListener("resize", handleResize);
			clearTimeout(timeout);
		};
	}, [updateDimensions]);

	return dimensions;
};
