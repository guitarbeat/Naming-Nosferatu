/**
 * @module AppNavbar
 * @description Premium consolidated navigation bar component
 * Features glassmorphism, smooth animations, and internal state management
 */

import React, { useCallback, useId, useMemo } from "react";
import LiquidGlass from "../LiquidGlass/LiquidGlass";
import "./AppNavbar.css";

// Components
import {
	MobileMenu,
	MobileMenuToggle,
	ModeToggles,
	NavbarActions,
	NavbarBrand,
	NavbarCollapseToggle,
	NavbarLink,
} from "./components";

// Context
import { NavbarProvider } from "./context/NavbarContext";
import { useNavbarDimensions } from "./hooks/useNavbarDimensions";
// Hooks
import {
	useAnalysisMode,
	useMobileMenu,
	useNavbarCollapse,
	useToggleAnalysis,
} from "./hooks/useNavbarLogic";
// Types
import type { AppNavbarProps, NavItem } from "./types";

// Utils
import { buildNavItems } from "./utils";

export function AppNavbar({
	view,
	setView,
	isLoggedIn,
	userName,
	isAdmin,
	onLogout,
	onOpenSuggestName,
	onOpenPhotos,
}: AppNavbarProps) {
	const navbarGlassId = useId();
	const { isCollapsed, toggle: toggleCollapse } = useNavbarCollapse(false);
	const {
		isMobileMenuOpen,
		toggle: toggleMobileMenu,
		close: closeMobileMenu,
	} = useMobileMenu();

	const { isAnalysisMode, setIsAnalysisMode } = useAnalysisMode();
	const toggleAnalysis = useToggleAnalysis(isAnalysisMode, setIsAnalysisMode);
	const dimensions = useNavbarDimensions(isCollapsed);

	const navItems = useMemo(
		() =>
			buildNavItems({
				view,
				isAnalysisMode,
				onOpenPhotos,
				onToggleAnalysis: toggleAnalysis,
			}),
		[view, isAnalysisMode, onOpenPhotos, toggleAnalysis],
	);

	const createHandler = useCallback(
		<T extends unknown[]>(fn?: (...args: T) => void) => {
			return (...args: T) => {
				closeMobileMenu();
				void Promise.resolve(fn?.(...args));
			};
		},
		[closeMobileMenu],
	);

	const handleNavClick = useCallback(
		(item: NavItem) => {
			closeMobileMenu();
			if (typeof item.onClick === "function") {
				void Promise.resolve(item.onClick());
				return;
			}
			setView(item.key);
		},
		[closeMobileMenu, setView],
	);

	const handleHomeClick = useCallback(() => {
		closeMobileMenu();
		setView("tournament");
	}, [closeMobileMenu, setView]);

	const handleLogout = createHandler(onLogout);

	const isHomeViewActive = view === "tournament" && !isAnalysisMode;

	const contextValue = useMemo(
		() => ({
			view,
			setView,
			isAnalysisMode,
			toggleAnalysis,
			isCollapsed,
			toggleCollapse,
			isMobileMenuOpen,
			toggleMobileMenu,
			closeMobileMenu,
			onOpenPhotos,
			onOpenSuggestName,
			isLoggedIn,
			userName,
			isAdmin,
			onLogout: handleLogout,
		}),
		[
			view,
			setView,
			isAnalysisMode,
			toggleAnalysis,
			isCollapsed,
			toggleCollapse,
			isMobileMenuOpen,
			toggleMobileMenu,
			closeMobileMenu,
			onOpenPhotos,
			onOpenSuggestName,
			isLoggedIn,
			userName,
			isAdmin,
			handleLogout,
		],
	);

	return (
		<NavbarProvider value={contextValue}>
			<LiquidGlass
				id={`navbar-glass-${navbarGlassId.replace(/:/g, "-")}`}
				className={`app-navbar-glass ${isCollapsed ? "collapsed" : ""}`}
				width={
					isCollapsed
						? dimensions.width
						: typeof window !== "undefined"
							? window.innerWidth
							: 1920
				}
				height={dimensions.height}
				key={`glass-${isCollapsed}`}
				style={
					isCollapsed
						? {
								width: "auto",
								maxWidth: "max-content",
								height: "auto",
								overflow: "visible",
							}
						: { width: "100%", height: "auto", overflow: "hidden" }
				}
				radius={isCollapsed ? 24 : 0}
				data-collapsed={isCollapsed}
			>
				<header
					id="app-navbar"
					className={`app-navbar ${isCollapsed ? "collapsed" : ""}`}
					role="banner"
					data-collapsed={isCollapsed}
				>
					<div className="app-navbar__left">
						<NavbarCollapseToggle
							isCollapsed={isCollapsed}
							onToggle={toggleCollapse}
						/>
						<div className="app-navbar__brand-wrapper">
							<NavbarBrand
								isActive={isHomeViewActive}
								onClick={handleHomeClick}
								ariaLabel="Go to Tournament home"
							/>
						</div>
					</div>

					<div className="app-navbar__center">
						{navItems.map((item) => (
							<NavbarLink key={item.key} item={item} onClick={handleNavClick} />
						))}
					</div>

					<div className="app-navbar__right">
						<div className="app-navbar__desktop-toggles">
							<ModeToggles />
						</div>

						<NavbarActions
							isLoggedIn={isLoggedIn}
							userName={userName}
							isAdmin={isAdmin}
							onLogout={handleLogout}
							onOpenSuggestName={onOpenSuggestName}
						/>

						<MobileMenuToggle
							isOpen={isMobileMenuOpen}
							onToggle={toggleMobileMenu}
						/>
					</div>
				</header>
			</LiquidGlass>

			<MobileMenu
				isOpen={isMobileMenuOpen}
				navItems={navItems}
				homeIsActive={isHomeViewActive}
				onHomeClick={handleHomeClick}
				onNavClick={handleNavClick}
			/>
		</NavbarProvider>
	);
}

export default React.memo(AppNavbar);
