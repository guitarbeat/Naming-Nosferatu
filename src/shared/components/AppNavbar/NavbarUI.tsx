/**
 * @module NavbarUI
 * @description Consolidated UI components for AppNavbar.
 */

import { Button } from "@heroui/react";
import React, { useEffect, useRef } from "react";
import styles from "./AppNavbar.module.css";
import type { BuildNavItemsContext, NavItem } from "./navbarCore";
import { NavbarContext } from "./navbarCore"; // Import from core

// --- ICONS ---

export interface IconProps {
	className?: string;
	"aria-hidden"?: boolean;
}

const Icon = ({
	children,
	...props
}: React.PropsWithChildren<IconProps>) => (
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		{...props}
	>
		{children}
	</svg>
);

const PhotosIcon = (props: IconProps) => (
	<Icon {...props}>
		<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
		<circle cx="8.5" cy="8.5" r="1.5" />
		<polyline points="21 15 16 10 5 21" />
	</Icon>
);

const AnalysisIcon = (props: IconProps) => (
	<Icon {...props}>
		<line x1="18" y1="20" x2="18" y2="10" />
		<line x1="12" y1="20" x2="12" y2="4" />
		<line x1="6" y1="20" x2="6" y2="14" />
	</Icon>
);

const SuggestIcon = (props: IconProps) => (
	<Icon {...props}>
		<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
		<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
	</Icon>
);

const LogoutIcon = (props: IconProps) => (
	<Icon {...props}>
		<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
		<polyline points="16 17 21 12 16 7" />
		<line x1="21" y1="12" x2="9" y2="12" />
	</Icon>
);

// --- UTILS (Moved here due to Icon dependency) ---

export function buildNavItems(context: BuildNavItemsContext): NavItem[] {
	const { view, isAnalysisMode, onOpenPhotos, onToggleAnalysis } = context;

	return [
		{
			key: "gallery",
			label: "Gallery",
			shortLabel: "Photos",
			icon: PhotosIcon,
			ariaLabel: "Open cat photo gallery",
			isActive: view === "photos",
			onClick: () => onOpenPhotos?.(),
		},
		{
			key: "analysis",
			label: "Analysis Mode",
			shortLabel: "Analysis",
			icon: AnalysisIcon,
			ariaLabel: isAnalysisMode
				? "Disable analysis mode"
				: "Enable analysis mode",
			isActive: Boolean(isAnalysisMode),
			onClick: () => onToggleAnalysis(),
		},
	];
}

// --- COMPONENTS ---

// UserDisplay
const MAX_NAME_LENGTH = 18;

function UserDisplay({
	userName,
	isAdmin = false,
}: {
	userName: string;
	isAdmin?: boolean;
}) {
	if (!userName) return null;

	const truncatedUserName =
		userName.length > MAX_NAME_LENGTH
			? `${userName.substring(0, MAX_NAME_LENGTH)}...`
			: userName;

	return (
		<div className="navbar-user-display">
			<div className="navbar-avatar-placeholder">
				{userName.charAt(0).toUpperCase()}
			</div>
			<div className="navbar-user-info">
				<span className="navbar-user-name">{truncatedUserName}</span>
				{isAdmin && <span className="navbar-admin-badge">Admin</span>}
			</div>
		</div>
	);
}

// NavbarActions
export function NavbarActions({
	isLoggedIn,
	userName,
	isAdmin,
	onLogout,
	onOpenSuggestName,
}: {
	isLoggedIn: boolean;
	userName?: string;
	isAdmin?: boolean;
	onLogout: () => void;
	onOpenSuggestName?: () => void;
}) {
	return (
		<div className="app-navbar__actions">
			{isLoggedIn && userName && (
				<UserDisplay userName={userName} isAdmin={isAdmin} />
			)}
			{onOpenSuggestName && (
				<Button
					onClick={onOpenSuggestName}
					className="app-navbar__action-btn app-navbar__action-btn--suggest"
					aria-label="Suggest a name"
					title="Suggest a new cat name"
				>
					<SuggestIcon aria-hidden />
					<span className="app-navbar__btn-text">Suggest</span>
				</Button>
			)}
			{isLoggedIn && (
				<Button
					onClick={onLogout}
					className="app-navbar__action-btn app-navbar__action-btn--logout"
					aria-label="Log out"
					title="Log out"
				>
					<LogoutIcon aria-hidden />
				</Button>
			)}
		</div>
	);
}

// NavbarToggle
export interface NavbarToggleProps {
	isActive: boolean;
	onToggle: () => void;
	leftLabel: string;
	rightLabel: string;
	ariaLabel: string;
}

const NavbarToggle = ({
	isActive,
	onToggle,
	leftLabel,
	rightLabel,
	ariaLabel,
}: NavbarToggleProps) => {
	return (
		<div className={styles.toggleContainer} onClick={onToggle}>
			<button
				type="button"
				className={styles.toggleWrapper}
				aria-label={ariaLabel}
				aria-pressed={isActive}
			>
				<div
					className={`${styles.toggleSlider} ${isActive ? styles.active : ""}`}
				/>
				<span
					className={`${styles.toggleLabel} ${!isActive ? styles.active : ""}`}
				>
					{leftLabel}
				</span>
				<span
					className={`${styles.toggleLabel} ${isActive ? styles.active : ""}`}
				>
					{rightLabel}
				</span>
			</button>
		</div>
	);
};

// ModeToggles
export const ModeToggles = ({ isMobile = false }: { isMobile?: boolean }) => {
	// Need to access context without hooking errors if possible, or just expect it to be wrapped
	const context = React.useContext(NavbarContext);
	if (!context) return null; // Or throw

	const { isAnalysisMode, toggleAnalysis, isCollapsed } = context;

	if (isCollapsed && !isMobile) return null;

	return (
		<div className="mode-toggles">
			<NavbarToggle
				isActive={isAnalysisMode}
				onToggle={toggleAnalysis}
				leftLabel="PLAY"
				rightLabel="ANALYSIS"
				ariaLabel="Toggle between Play and Analysis modes"
			/>
		</div>
	);
};

// NavbarBrand
export function NavbarBrand({
	isActive,
	onClick,
	ariaLabel,
}: {
	isActive: boolean;
	onClick: () => void;
	ariaLabel: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="app-navbar__brand"
			data-active={isActive}
			aria-current={isActive ? "page" : undefined}
			aria-label={ariaLabel}
		>
			<span className="app-navbar__brand-text">Tournament</span>
			<span className="app-navbar__brand-subtext">Daily Bracket</span>
		</button>
	);
}

// MobileMenuToggle
export function MobileMenuToggle({
	isOpen,
	onToggle,
}: {
	isOpen: boolean;
	onToggle: () => void;
}) {
	return (
		<button
			type="button"
			className="app-navbar__toggle"
			aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
			aria-expanded={isOpen}
			aria-controls="app-navbar-mobile-panel"
			onClick={onToggle}
		>
			<div className="hamburger-icon">
				<span />
				<span />
				<span />
			</div>
		</button>
	);
}

// NavbarCollapseToggle
export function NavbarCollapseToggle({
	isCollapsed,
	onToggle,
}: {
	isCollapsed: boolean;
	onToggle: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onToggle}
			className="app-navbar__collapse-toggle"
			aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
			aria-expanded={!isCollapsed}
			title={isCollapsed ? "Expand" : "Collapse"}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width={20}
				height={20}
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
				className={`app-navbar__collapse-icon ${isCollapsed ? "collapsed" : ""}`}
				aria-hidden
			>
				<path d="M15 18l-6-6 6-6" />
			</svg>
		</button>
	);
}

// NavbarLink
export function NavbarLink({
	item,
	onClick,
	className = "app-navbar__link",
	showIcon = true,
}: {
	item: NavItem;
	onClick: (item: NavItem) => void;
	className?: string;
	showIcon?: boolean;
}) {
	const Icon = item.icon;

	return (
		<button
			type="button"
			onClick={() => onClick(item)}
			className={className}
			data-active={item.isActive}
			aria-current={item.isActive ? "page" : undefined}
			aria-label={item.ariaLabel || item.label}
			title={item.label}
		>
			{showIcon && Icon && (
				<Icon className="app-navbar__link-icon" aria-hidden />
			)}
			<span className="app-navbar__link-text">
				{item.shortLabel || item.label}
			</span>
		</button>
	);
}

// MobileMenu
export function MobileMenu({
	isOpen,
	navItems,
	homeIsActive,
	onHomeClick,
	onNavClick,
}: {
	isOpen: boolean;
	navItems: NavItem[];
	homeIsActive: boolean;
	onHomeClick: () => void;
	onNavClick: (item: NavItem) => void;
}) {
	const firstLinkRef = useRef<HTMLButtonElement>(null);
	const lastLinkRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (isOpen && firstLinkRef.current) {
			firstLinkRef.current.focus();
		}
	}, [isOpen]);

	const handleKeyDown = (
		event: React.KeyboardEvent,
		isFirst: boolean,
		isLast: boolean,
	) => {
		if (event.key === "Tab") {
			if (event.shiftKey && isFirst) {
				event.preventDefault();
				lastLinkRef.current?.focus();
			} else if (!event.shiftKey && isLast) {
				event.preventDefault();
				firstLinkRef.current?.focus();
			}
		}
	};

	if (!isOpen) return null;

	return (
		<nav
			id="app-navbar-mobile-panel"
			className="app-navbar-mobile-panel"
			role="navigation"
			aria-label="Mobile navigation"
			data-open={isOpen}
		>
			<div className="app-navbar-mobile-panel__content">
				<button
					ref={firstLinkRef}
					type="button"
					onClick={onHomeClick}
					className="app-navbar__mobile-link"
					data-active={homeIsActive}
					aria-current={homeIsActive ? "page" : undefined}
					onKeyDown={(e) => handleKeyDown(e, true, navItems.length === 0)}
				>
					<span className="app-navbar__link-text">Tournament</span>
				</button>

				{navItems.map((item, index) => {
					const _isLast = index === navItems.length - 1;
					return (
						<NavbarLink
							key={item.key}
							item={item}
							onClick={onNavClick}
							className="app-navbar__mobile-link"
						/>
					);
				})}

				<div className="app-navbar__mobile-separator" />
				<div className="app-navbar__mobile-toggles">
					<ModeToggles isMobile />
				</div>
			</div>
		</nav>
	);
}
