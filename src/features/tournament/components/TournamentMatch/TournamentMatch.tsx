/**
 * @module Tournament/components/TournamentMatch
 * @description Component for displaying the current tournament match with ferrofluid-inspired design
 */

import { motion } from "framer-motion";
import PropTypes from "prop-types";
import React, { useRef } from "react";
import Button from "../../../../shared/components/Button/Button";
import { Error } from "../../../../shared/components/CommonUI";
import type { NameItem } from "../../../../shared/propTypes";
import useMagneticPull from "../../hooks/tournamentComponentHooks";
import controlsStyles from "../../styles/TournamentControls.module.css";
import errorStyles from "../../styles/TournamentError.module.css";
import tournamentStyles from "../../styles/TournamentMatch.module.css";
import { getRandomCatImage } from "../../tournamentUtils";
import styles from "./FerrofluidMatch.module.css";

interface TournamentMatchProps {
	currentMatch: {
		left?: NameItem | string;
		right?: NameItem | string;
	};
	selectedOption: "left" | "right" | "both" | "neither" | null;
	isProcessing: boolean;
	isTransitioning: boolean;
	votingError?: unknown;
	onNameCardClick: (option: "left" | "right") => void;
	onVoteWithAnimation: (option: string) => void;
	onVoteRetry: () => void;
	onDismissError: () => void;
	showCatPictures?: boolean;
	imageList?: string[];
}

function TournamentMatch({
	currentMatch,
	selectedOption,
	isProcessing,
	isTransitioning,
	votingError,
	onNameCardClick,
	onVoteWithAnimation,
	onVoteRetry,
	onDismissError,
	showCatPictures = false,
	imageList = [],
}: TournamentMatchProps): React.ReactElement {
	const leftOrbRef = useRef<HTMLDivElement>(null);
	const rightOrbRef = useRef<HTMLDivElement>(null);
	const isEnabled = !isProcessing && !isTransitioning;

	useMagneticPull(leftOrbRef, rightOrbRef, isEnabled);

	const getDetails = (item?: NameItem | string) => {
		if (!item) return { name: "Unknown", id: null };
		if (typeof item === "string") return { name: item, id: item };
		return { name: item.name || "Unknown", id: item.id || null };
	};

	const leftDetails = getDetails(currentMatch.left);
	const rightDetails = getDetails(currentMatch.right);

	const leftImage =
		showCatPictures && leftDetails.id
			? getRandomCatImage(leftDetails.id, imageList)
			: undefined;

	const rightImage =
		showCatPictures && rightDetails.id
			? getRandomCatImage(rightDetails.id, imageList)
			: undefined;

	return (
		<div
			className={tournamentStyles.matchup}
			role="region"
			aria-label="Current matchup"
			aria-busy={isTransitioning || isProcessing}
		>
			{/* SVG Filter Definition */}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				version="1.1"
				className={styles.ferroFilter}
			>
				<defs>
					<filter id="tournament-ferro-goo">
						<feGaussianBlur
							in="SourceGraphic"
							stdDeviation="12"
							result="blur"
						/>
						<feColorMatrix
							in="blur"
							mode="matrix"
							values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -12"
							result="goo"
						/>
						<feComposite in="SourceGraphic" in2="goo" operator="atop" />
					</filter>
				</defs>
			</svg>

			{/* Battle Stage */}
			<div
				className={styles.battleStage}
				style={{ filter: "url(#tournament-ferro-goo)" } as React.CSSProperties}
				key="battle-stage"
			>
				<div className={styles.stageWrapper}>
					{/* Left Fighter Orb */}
					<motion.div
						ref={leftOrbRef}
						layout
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						whileHover={isEnabled ? { scale: 1.02 } : {}}
						whileTap={isEnabled ? { scale: 0.98 } : {}}
						transition={{ duration: 0.2, ease: "easeOut" }}
						className={`${styles.fighterOrb} ${selectedOption === "left" ? styles.selected : ""} ${!isEnabled ? styles.disabled : ""}`}
						role="button"
						tabIndex={isEnabled ? 0 : -1}
						aria-label={`Select ${leftDetails.name}`}
						aria-pressed={selectedOption === "left"}
						onClick={() => isEnabled && onNameCardClick("left")}
						onKeyDown={(e) => {
							if (isEnabled && (e.key === "Enter" || e.key === " ")) {
								e.preventDefault();
								onNameCardClick("left");
							}
						}}
					>
						<div className={styles.spikes} aria-hidden="true" />
						<div className={styles.fighterContent}>
							{leftImage && (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ delay: 0.1 }}
									className={styles.avatarWrap}
								>
									<img src={leftImage} alt={leftDetails.name} />
								</motion.div>
							)}
							<h3 className={styles.nameText}>{leftDetails.name}</h3>
						</div>
					</motion.div>

					{/* VS Text */}
					<div className={styles.vsCore} aria-hidden="true">
						<div className={styles.vsText}>VS</div>
					</div>

					{/* Right Fighter Orb */}
					<motion.div
						ref={rightOrbRef}
						layout
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						whileHover={isEnabled ? { scale: 1.02 } : {}}
						whileTap={isEnabled ? { scale: 0.98 } : {}}
						transition={{ duration: 0.2, ease: "easeOut" }}
						className={`${styles.fighterOrb} ${styles.right} ${selectedOption === "right" ? styles.selected : ""} ${!isEnabled ? styles.disabled : ""}`}
						role="button"
						tabIndex={isEnabled ? 0 : -1}
						aria-label={`Select ${rightDetails.name}`}
						aria-pressed={selectedOption === "right"}
						onClick={() => isEnabled && onNameCardClick("right")}
						onKeyDown={(e) => {
							if (isEnabled && (e.key === "Enter" || e.key === " ")) {
								e.preventDefault();
								onNameCardClick("right");
							}
						}}
					>
						<div className={styles.spikes} aria-hidden="true" />
						<div className={styles.fighterContent}>
							{rightImage && (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ delay: 0.1 }}
									className={styles.avatarWrap}
								>
									<img src={rightImage} alt={rightDetails.name} />
								</motion.div>
							)}
							<h3 className={styles.nameText}>{rightDetails.name}</h3>
						</div>
					</motion.div>

					{/* Magnetic Line */}
					<div className={styles.magneticLine} aria-hidden="true" />
				</div>
			</div>

			{/* Extra Voting Options */}
			<div
				className={controlsStyles.extraOptions}
				role="group"
				aria-label="Additional voting options"
			>
				<Button
					onClick={() => onVoteWithAnimation("both")}
					disabled={isProcessing || isTransitioning}
					variant={selectedOption === "both" ? "primary" : "secondary"}
					className={`${controlsStyles.extraOptionsButton} ${selectedOption === "both" ? controlsStyles.selected : ""}`}
					aria-pressed={selectedOption === "both"}
					aria-label="Vote for both names (Press Up arrow key)"
				>
					I Like Both!{" "}
					<span className={controlsStyles.shortcutHint} aria-hidden="true">
						(↑ Up)
					</span>
				</Button>

				<Button
					onClick={() => onVoteWithAnimation("neither")}
					disabled={isProcessing || isTransitioning}
					variant={selectedOption === "neither" ? "primary" : "secondary"}
					className={`${controlsStyles.extraOptionsButton} ${selectedOption === "neither" ? controlsStyles.selected : ""}`}
					aria-pressed={selectedOption === "neither"}
					aria-label="Skip this match (Press Down arrow key)"
				>
					Skip{" "}
					<span className={controlsStyles.shortcutHint} aria-hidden="true">
						(↓ Down)
					</span>
				</Button>
			</div>

			{/* Voting Error Display */}
			{!!votingError && (
				<Error
					variant="inline"
					error={votingError as Error}
					context="vote"
					position="below"
					onRetry={onVoteRetry}
					onDismiss={onDismissError}
					showRetry={true}
					showDismiss={true}
					size="medium"
					className={errorStyles.votingError}
				/>
			)}
		</div>
	);
}

TournamentMatch.propTypes = {
	currentMatch: PropTypes.shape({
		left: PropTypes.shape({
			name: PropTypes.string,
			description: PropTypes.string,
			id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		}),
		right: PropTypes.shape({
			name: PropTypes.string,
			description: PropTypes.string,
			id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		}),
	}).isRequired,
	selectedOption: PropTypes.oneOf(["left", "right", "both", "neither", null]),
	isProcessing: PropTypes.bool.isRequired,
	isTransitioning: PropTypes.bool.isRequired,
	votingError: PropTypes.object,
	onNameCardClick: PropTypes.func.isRequired,
	onVoteWithAnimation: PropTypes.func.isRequired,
	onVoteRetry: PropTypes.func.isRequired,
	onDismissError: PropTypes.func.isRequired,
	showCatPictures: PropTypes.bool,
	imageList: PropTypes.array,
};

export default React.memo(TournamentMatch);
