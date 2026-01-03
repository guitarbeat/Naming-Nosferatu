import styles from "../AppNavbar.module.css";

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
