import { AnimatePresence } from "framer-motion";
import { memo, useMemo } from "react";
import "./AppNavbar.css";
import {
	buildNavItems,
	MAIN_NAV_ITEMS,
	NavbarProvider,
	useAnalysisMode,
	useMobileMenu,
	useNavbarCollapse,
	useNavbarDimensions,
	useToggleAnalysis,
} from "../../navigation";
import {
	MobileMenu,
	MobileMenuToggle,
	ModeToggles,
	NavbarActions,
	NavbarBrand,
	NavbarCollapseToggle,
	NavbarLink,
} from "./NavbarUI";

interface AppNavbarProps {
	view: string;
	setView: (view: string) => void;
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

export const AppNavbar = memo(function AppNavbar({
	view,
	setView,
	isLoggedIn,
	userName,
	isAdmin,
	onLogout,
	// onStartNewTournament,
	onOpenSuggestName,
	onOpenPhotos,
	onNavigate,
}: AppNavbarProps) {
	// Hooks
	const { isCollapsed, toggle: toggleCollapse } = useNavbarCollapse();
	const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useMobileMenu();
	const { isAnalysisMode, setIsAnalysisMode } = useAnalysisMode();
	const toggleAnalysis = useToggleAnalysis(isAnalysisMode, setIsAnalysisMode);
	useNavbarDimensions(isCollapsed);

	// Context Value
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
			onLogout,
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
			onLogout,
		],
	);

	// Navigation Items
	const navItems = useMemo(
		() =>
			buildNavItems(
				{
					currentRoute: onNavigate ? window.location.pathname : undefined,
					onNavigate,
					onOpenPhotos,
					onToggleAnalysis: toggleAnalysis,
					isAnalysisMode,
				},
				MAIN_NAV_ITEMS,
			),
		[isAnalysisMode, onOpenPhotos, toggleAnalysis, onNavigate],
	);

	const handleHomeClick = () => {
		if (onNavigate) {
			onNavigate("/");
		}
		closeMobileMenu();
	};

	const handleNavClick = (item: { key: string; onClick?: () => void }) => {
		if (item.onClick) {
			item.onClick();
		}
		closeMobileMenu();
	};

	const headerClass = `app-navbar ${isCollapsed ? "collapsed" : ""} ${isMobileMenuOpen ? "mobileOpen" : ""}`;

	return (
		<NavbarProvider value={contextValue}>
			<header id="app-navbar" className={headerClass} data-collapsed={isCollapsed}>
				<div className="app-navbar__container">
					{/* Left: Brand/Logo */}
					<div className="app-navbar__left-section">
						<NavbarBrand
							isActive={view === "tournament"}
							onClick={handleHomeClick}
							ariaLabel="Go to Tournament Dashboard"
						/>
					</div>

					{/* Center: Navigation Links */}
					<nav
						className="app-navbar__center-section"
						role="navigation"
						aria-label="Main navigation"
					>
						{navItems.map((item) => (
							<NavbarLink
								key={item.key}
								item={item}
								onClick={handleNavClick}
								className="app-navbar__link"
							/>
						))}
					</nav>

					{/* Right: Actions & Toggles */}
					<div className="app-navbar__right-section">
						<div className="app-navbar__desktop-only">
							<ModeToggles />
						</div>

						<NavbarActions
							isLoggedIn={isLoggedIn}
							userName={userName}
							isAdmin={isAdmin}
							onLogout={onLogout}
							onOpenSuggestName={onOpenSuggestName}
						/>

						<div className="app-navbar__mobile-only">
							<MobileMenuToggle isOpen={isMobileMenuOpen} onToggle={toggleMobileMenu} />
						</div>

						<div className="app-navbar__collapse-toggle-wrapper">
							<NavbarCollapseToggle isCollapsed={isCollapsed} onToggle={toggleCollapse} />
						</div>
					</div>
				</div>

				{/* Mobile Menu Overlay */}
				<AnimatePresence>
					{isMobileMenuOpen && (
						<MobileMenu
							isOpen={isMobileMenuOpen}
							navItems={navItems}
							homeIsActive={view === "tournament" && !isAnalysisMode}
							onHomeClick={handleHomeClick}
							onNavClick={handleNavClick}
						/>
					)}
				</AnimatePresence>
			</header>
		</NavbarProvider>
	);
});
