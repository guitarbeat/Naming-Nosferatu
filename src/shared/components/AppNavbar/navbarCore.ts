/**
 * @module navbarCore
 * @description Consolidated core logic for AppNavbar.
 * Includes Types, Utils, Context, and Hooks.
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { STORAGE_KEYS } from "../../../core/constants";
import { useCollapsible } from "../../../core/hooks/useStorage";
import { AnalysisIcon, PhotosIcon } from "./components/Icons"; // Will likely move to NavbarUI, but need to resolve circularity or just move icons to UI and use strings here?
// Actually, buildNavItems uses Icons. Let's keep buildNavItems here but maybe pass Icons or just import them from UI later.
// For now, I'll assume Icons will be in NavbarUI.ts, but `navbarCore.ts` shouldn't depend on `NavbarUI.tsx` if possible.
// Better: Move Icons to `navbarCore.ts` OR just keep them in UI and import them.
// Let's import them from where they WILL be, or keep them separate?
// Simplest: keep Icons in `NavbarUI.tsx` and import them here.
// But `NavbarUI.tsx` doesn't exist yet.
// I will temporarily import from `./components/Icons` and fix it later or move Icons here?
// Icons are UI. `navbarCore` is logic.
// `buildNavItems` returns objects with Icon components.
// I'll keep `buildNavItems` here.

// --- TYPES ---

export type ViewType = string;

export interface NavItem {
    key: string;
    label: string;
    shortLabel?: string;
    icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
    className?: string;
    "aria-hidden"?: boolean;
    ariaLabel?: string;
    isActive: boolean;
    onClick?: () => void;
}

export interface AppNavbarProps {
    view: ViewType;
    setView: (view: ViewType) => void;
    isLoggedIn: boolean;
    userName?: string;
    isAdmin?: boolean;
    onLogout: () => void;
    onStartNewTournament?: () => void;
    onOpenSuggestName?: () => void;
    onOpenPhotos?: () => void;
    currentRoute?: string;
    onNavigate?: (route: string) => void;
}

export interface NavbarContextValue {
    view: ViewType;
    setView: (view: ViewType) => void;
    isAnalysisMode: boolean;
    toggleAnalysis: () => void;
    isCollapsed: boolean;
    toggleCollapse: () => void;
    isMobileMenuOpen: boolean;
    toggleMobileMenu: () => void;
    closeMobileMenu: () => void;
    onOpenPhotos?: () => void;
    onOpenSuggestName?: () => void;
    isLoggedIn: boolean;
    userName?: string;
    isAdmin?: boolean;
    onLogout: () => void;
}

export interface BuildNavItemsContext {
    view: ViewType;
    isAnalysisMode: boolean;
    onOpenPhotos?: () => void;
    onToggleAnalysis: () => void;
}

// --- CONTEXT ---

export const NavbarContext = createContext<NavbarContextValue | null>(null);

export const NavbarProvider = ({
    value,
    children,
}: {
    value: NavbarContextValue;
    children: React.ReactNode;
}) => {
    return (
        <NavbarContext.Provider value= { value } > { children } </NavbarContext.Provider>
	);
};

export const useNavbarContext = () => {
    const context = useContext(NavbarContext);
    if (!context) {
        throw new Error("useNavbarContext must be used within a NavbarProvider");
    }
    return context;
};

// --- HOOKS ---

// useNavbarCollapse
export function useNavbarCollapse(defaultCollapsed = false) {
    const { isCollapsed, toggleCollapsed } = useCollapsible(
        STORAGE_KEYS.NAVBAR_COLLAPSED,
        defaultCollapsed,
    );
    return { isCollapsed, toggle: toggleCollapsed };
}

// useMobileMenu
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

// useAnalysisMode
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

// useNavbarDimensions
export interface NavbarDimensions {
    width: number;
    height: number;
}

export const useNavbarDimensions = (_isCollapsed: boolean) => {
    const [dimensions, setDimensions] = useState<NavbarDimensions>({
        width: 0,
        height: 0,
    });

    const updateDimensions = useCallback(() => {
        if (typeof window === "undefined") return;

        const navbarElement = document.getElementById("app-navbar");
        if (navbarElement) {
            const rect = navbarElement.getBoundingClientRect();
            setDimensions({
                width: rect.width,
                height: rect.height,
            });

            // Update CSS variable for the rest of the app to use
            document.documentElement.style.setProperty(
                "--navbar-height",
                `${rect.height}px`,
            );
            document.documentElement.style.setProperty(
                "--navbar-width",
                `${rect.width}px`,
            );
        }
    }, []);

    useEffect(() => {
        updateDimensions();
        // Also update after transition ends
        const timeout = setTimeout(updateDimensions, 400);

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

// --- UTILS ---
// Copied from utils.ts, but we need icons.
// To avoid circular dependency with NavbarUI (which will have icons),
// we might need to move Icons HERE or inject them.
// I'll move Icons logic to NavbarUI and just keep helpers here if they don't need UI components.
// buildNavItems DOES need UI components (Icons).
// So `buildNavItems` should probably reside in NavbarUI.ts or close to Icons.
// But `AppNavbar.tsx` calls it.
// I will move `buildNavItems` to `NavbarUI.tsx` as well, or keep it here and import Icons later.
// For now, I'll export a placeholder or interface.
