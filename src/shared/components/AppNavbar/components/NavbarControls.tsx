import styles from "../AppNavbar.module.css";
import { useNavbarContext } from "../context/NavbarContext";
import type { NavItem } from "../types";

// --- NavbarToggle ---
export interface NavbarToggleProps {
	isActive: boolean;
	onToggle: () => void;
	leftLabel: string;
	rightLabel: string;
	ariaLabel: string;
}

export const NavbarToggle = ({
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

// --- ModeToggles ---
export const ModeToggles = ({ isMobile = false }: { isMobile?: boolean }) => {
	const { isAnalysisMode, toggleAnalysis, isCollapsed } = useNavbarContext();

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

// --- NavbarBrand ---
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

// --- MobileMenuToggle ---
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

// --- NavbarCollapseToggle ---
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

// --- NavbarLink ---
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
