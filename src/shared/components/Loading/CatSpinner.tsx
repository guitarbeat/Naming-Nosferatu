/**
 * @module CatSpinner
 * @description Cat-themed loading spinner component with multiple animation variants
 */

import type React from "react";
import { memo, useMemo } from "react";
import styles from "./CatSpinner.module.css";

export interface CatSpinnerProps {
	/**
	 * Size of the spinner
	 * @default "medium"
	 */
	size?: "small" | "medium" | "large";
	/**
	 * Animation variant
	 * @default "paw"
	 */
	variant?: "paw" | "tail" | "bounce" | "spin" | "heartbeat" | "orbit";
	/**
	 * Color theme
	 * @default "neon"
	 */
	color?: "neon" | "pastel" | "warm";
	/**
	 * Show cat face
	 * @default true
	 */
	showFace?: boolean;
	/**
	 * Custom text below spinner
	 */
	text?: string;
	/**
	 * Additional class names
	 */
	className?: string;
}

const CatSpinner: React.FC<CatSpinnerProps> = memo(
	({
		size = "medium",
		variant = "paw",
		color = "neon",
		showFace = true,
		text,
		className = "",
	}) => {
		const containerClasses = useMemo(
			() => [
				styles.catSpinner,
				styles[size],
				styles[variant],
				styles[color],
				showFace && styles.withFace,
				className,
			]
				.filter(Boolean)
				.join(" "),
			[size, variant, color, showFace, className]
		);

		const renderSpinner = () => {
			switch (variant) {
				case "paw":
					return (
						<>
							<div className={styles.pawContainer}>
								<div className={styles.paw}>
									<div className={styles.pawPad}></div>
									<div className={styles.pawPad}></div>
									<div className={styles.pawPad}></div>
									<div className={styles.pawPad}></div>
								</div>
							</div>
							{showFace && <div className={styles.catFace}></div>}
						</>
					);

				case "tail":
					return (
						<>
							<div className={styles.tailContainer}>
								<div className={styles.tail}>
									<div className={styles.tailSegment}></div>
									<div className={styles.tailSegment}></div>
									<div className={styles.tailSegment}></div>
									<div className={styles.tailSegment}></div>
									<div className={styles.tailSegment}></div>
								</div>
							</div>
							{showFace && <div className={styles.catFace}></div>}
						</>
					);

				case "bounce":
					return (
						<>
							<div className={styles.bounceContainer}>
								<div className={styles.bouncingCat}>
									<div className={styles.catBody}></div>
									<div className={styles.catHead}></div>
								</div>
							</div>
							{showFace && <div className={styles.catFace}></div>}
						</>
					);

				case "spin":
					return (
						<div className={styles.spinContainer}>
							<div className={styles.spinningCat}>
								{showFace && (
									<>
										<div className={styles.ear}></div>
										<div className={styles.ear}></div>
										<div className={styles.eye}></div>
										<div className={styles.eye}></div>
										<div className={styles.nose}></div>
									</>
								)}
							</div>
						</div>
					);

				case "heartbeat":
					return (
						<>
							<div className={styles.heartbeatContainer}>
								<div className={styles.heartCat}>
									<div className={styles.heartShape}></div>
									<div className={styles.heartEyes}></div>
								</div>
							</div>
							{showFace && <div className={styles.catFace}></div>}
						</>
					);

				case "orbit":
					return (
						<div className={styles.orbitContainer}>
							<div className={styles.orbitRing}>
								<div className={styles.orbitCat}></div>
							</div>
							{showFace && <div className={styles.catFace}></div>}
						</div>
					);

				default:
					return (
						<>
							<div className={styles.pawContainer}>
								<div className={styles.paw}>
									<div className={styles.pawPad}></div>
									<div className={styles.pawPad}></div>
									<div className={styles.pawPad}></div>
									<div className={styles.pawPad}></div>
								</div>
							</div>
							{showFace && <div className={styles.catFace}></div>}
						</>
					);
			}
		};

		return (
			<div className={containerClasses} role="status" aria-label="Loading">
				<div className={styles.spinnerContainer}>
					{renderSpinner()}
				</div>
				{text && <p className={styles.spinnerText}>{text}</p>}
				<span className={styles.srOnly}>Loading...</span>
			</div>
		);
	}
);

CatSpinner.displayName = "CatSpinner";

export default CatSpinner;