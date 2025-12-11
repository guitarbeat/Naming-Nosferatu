/**
 * @module AppNavbar/types
 * @description TypeScript type definitions for AppNavbar component
 */

export type ViewType = "tournament" | "photos" | string;

export type ThemePreference = "light" | "dark" | "system";

export type ThemeType = "light" | "dark";

export interface NavItem {
  key: string;
  label: string;
  shortLabel?: string;
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
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
  themePreference: ThemePreference;
  currentTheme: ThemeType;
  onThemePreferenceChange: (preference: ThemePreference) => void;
  onThemeToggle?: () => void;
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
  themePreference: ThemePreference;
  currentTheme: ThemeType;
  onThemePreferenceChange: (preference: ThemePreference) => void;
  onThemeToggle?: () => void;
  isLoggedIn: boolean;
  userName?: string;
  isAdmin?: boolean;
  onLogout: () => void;
}
