import { useContext } from "react";
import styles from "./AppNavbar.module.css";
import { NavbarContext } from "./navbarCore";

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
				<div className={`${styles.toggleSlider} ${isActive ? styles.active : ""}`} />
				<span className={`${styles.toggleLabel} ${isActive ? "" : styles.active}`}>
					{leftLabel}
				</span>
				<span className={`${styles.toggleLabel} ${isActive ? styles.active : ""}`}>
					{rightLabel}
				</span>
			</button>
		</div>
	);
};

export const ModeToggles = ({ isMobile = false }: { isMobile?: boolean }) => {
	const context = useContext(NavbarContext);

	if (!context) {
		return null;
	}

	const { isAnalysisMode, toggleAnalysis, isCollapsed } = context;

	if (isCollapsed && !isMobile) {
		return null;
	}

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
				aria-hidden={true}
			>
				<path d="M15 18l-6-6 6-6" />
			</svg>
		</button>
	);
}
