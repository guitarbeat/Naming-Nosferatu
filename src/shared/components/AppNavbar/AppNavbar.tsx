import { memo, useMemo } from "react";
import "./AppNavbar.css";
import styles from "./AppNavbar.module.css";
import {
	MobileMenu,
	MobileMenuToggle,
	ModeToggles,
	NavbarActions,
	NavbarBrand,
	NavbarCollapseToggle,
	NavbarLink,
	buildNavItems,
} from "./NavbarUI";
import {
	NavbarProvider,
	type AppNavbarProps,
	useAnalysisMode,
	useMobileMenu,
	useNavbarCollapse,
	useNavbarDimensions,
	useToggleAnalysis,
} from "./navbarCore";

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
	const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } =
		useMobileMenu();
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
			buildNavItems({
				view,
				isAnalysisMode,
				onOpenPhotos,
				onToggleAnalysis: toggleAnalysis,
			}),
		[view, isAnalysisMode, onOpenPhotos, toggleAnalysis],
	);

	const handleHomeClick = () => {
		if (onNavigate) {
			onNavigate("/");
		}
		if (isAnalysisMode) {
			toggleAnalysis();
		}
		closeMobileMenu();
	};

	const handleNavClick = (item: {
		key: string;
		onClick?: () => void;
	}) => {
		if (item.onClick) {
			item.onClick();
		}
		closeMobileMenu();
	};

	const headerClass = `${styles.appNavbar} ${isCollapsed ? styles.collapsed : ""} ${isMobileMenuOpen ? styles.mobileOpen : ""}`;

	return (
		<NavbarProvider value={contextValue}>
			<header
				id="app-navbar"
				className={headerClass}
				data-collapsed={isCollapsed}
			>
				<div className={styles.container}>
					{/* Left: Brand/Logo */}
					<div className={styles.leftSection}>
						<NavbarBrand
							isActive={view === "tournament" && !isAnalysisMode}
							onClick={handleHomeClick}
							ariaLabel="Go to Tournament Dashboard"
						/>
					</div>

					{/* Center: Navigation Links */}
					<nav
						className={styles.centerSection}
						role="navigation"
						aria-label="Main navigation"
					>
						{navItems.map((item) => (
							<NavbarLink
								key={item.key}
								item={item}
								onClick={handleNavClick}
								className={styles.navLink}
							/>
						))}
					</nav>

					{/* Right: Actions & Toggles */}
					<div className={styles.rightSection}>
						<div className={styles.desktopOnly}>
							<ModeToggles />
						</div>

						<NavbarActions
							isLoggedIn={isLoggedIn}
							userName={userName}
							isAdmin={isAdmin}
							onLogout={onLogout}
							onOpenSuggestName={onOpenSuggestName}
						/>

						<div className={styles.mobileOnly}>
							<MobileMenuToggle
								isOpen={isMobileMenuOpen}
								onToggle={toggleMobileMenu}
							/>
						</div>

						<div className={styles.collapseToggleWrapper}>
							<NavbarCollapseToggle
								isCollapsed={isCollapsed}
								onToggle={toggleCollapse}
							/>
						</div>
					</div>
				</div>

				{/* Mobile Menu Overlay */}
				<MobileMenu
					isOpen={isMobileMenuOpen}
					navItems={navItems}
					homeIsActive={view === "tournament" && !isAnalysisMode}
					onHomeClick={handleHomeClick}
					onNavClick={handleNavClick}
				/>
			</header>
		</NavbarProvider>
	);
});
