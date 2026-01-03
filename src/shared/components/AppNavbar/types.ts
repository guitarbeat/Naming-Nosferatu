import type React from "react";

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
