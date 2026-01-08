/**
 * @module Tournament/components/TournamentMatch
 * @description Component for displaying the current tournament match with ferrofluid-inspired design
 */

import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import PropTypes from "prop-types";
import React, { useRef } from "react";
import type { NameItem } from "@/types/components";
import Button from "../../../../shared/components/Button/Button";
import { Error } from "../../../../shared/components/Error";
import { playSound } from "../../../../shared/utils/soundManager";
import useMagneticPull from "../../hooks/tournamentComponentHooks";
import controlsStyles from "../../styles/Controls.module.css";
import errorStyles from "../../styles/Error.module.css";
import tournamentStyles from "../../styles/Match.module.css";
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
	onVoteWithAnimation: (option: string) => Promise<void>;
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
	const [showVoteConfirmation, setShowVoteConfirmation] = React.useState<"left" | "right" | null>(
		null,
	);
	const [ripples, setRipples] = React.useState<{ id: string; side: "left" | "right" }[]>([]);
	const isEnabled = !isProcessing && !isTransitioning;

	// Show vote confirmation checkmark
	React.useEffect(() => {
		if (selectedOption === "left" || selectedOption === "right") {
			setShowVoteConfirmation(selectedOption);
			// Play vote confirmation sound
			playSound("wow");
			const timer = setTimeout(() => {
				setShowVoteConfirmation(null);
			}, 800);
			return () => clearTimeout(timer);
		}
		return undefined;
	}, [selectedOption]);

	useMagneticPull(leftOrbRef, rightOrbRef, isEnabled);

	// Handle ripple effects on click
	const createRipple = React.useCallback((side: "left" | "right") => {
		const rippleId = `${side}-${Date.now()}`;
		setRipples((prev) => [...prev, { id: rippleId, side }]);

		// Remove ripple after animation completes
		setTimeout(() => {
			setRipples((prev) => prev.filter((ripple) => ripple.id !== rippleId));
		}, 800);
	}, []);

	// Handle swipe end
	const handleDragEnd = (side: "left" | "right", info: PanInfo) => {
		if (!isEnabled) {
			return;
		}

		const SwipeThreshold = 100;
		const offset = info.offset.x;

		// Logic: Drag towards center (winner) to vote for that side
		if (side === "left" && offset > SwipeThreshold) {
			// Dragged left orb to the right (towards center)
			createRipple("left");
			playSound("gameboy-pluck");
			onNameCardClick("left");
		} else if (side === "right" && offset < -SwipeThreshold) {
			// Dragged right orb to the left (towards center)
			createRipple("right");
			playSound("gameboy-pluck");
			onNameCardClick("right");
		}
	};

	const getDetails = (item?: NameItem | string) => {
		if (!item) {
			return { name: "Unknown", id: null };
		}
		if (typeof item === "string") {
			return { name: item, id: item };
		}
		return { name: item.name || "Unknown", id: item.id || null };
	};

	const leftDetails = getDetails(currentMatch.left);
	const rightDetails = getDetails(currentMatch.right);

	const leftImage =
		showCatPictures && leftDetails.id ? getRandomCatImage(leftDetails.id, imageList) : undefined;

	const rightImage =
		showCatPictures && rightDetails.id ? getRandomCatImage(rightDetails.id, imageList) : undefined;

	return (
		<div
			className={tournamentStyles.matchup}
			role="region"
			aria-label="Current matchup"
			aria-busy={isTransitioning || isProcessing}
		>
			{/* SVG Filter Definition */}
			<svg xmlns="http://www.w3.org/2000/svg" version="1.1" className={styles.ferroFilter}>
				<defs>
					<filter id="tournament-ferro-goo">
						<feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
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
						layout={true}
						drag={isEnabled ? "x" : false}
						dragConstraints={{ left: 0, right: 0 }}
						dragElastic={0.2}
						onDragEnd={(_, info) => handleDragEnd("left", info)}
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						whileHover={isEnabled ? { scale: 1.02 } : {}}
						whileTap={isEnabled ? { scale: 0.98 } : {}}
						transition={{ duration: 0.2, ease: "easeOut" }}
						className={`${styles.fighterOrb} ${selectedOption === "left" ? styles.selected : ""} ${isEnabled ? "" : styles.disabled}`}
						role="button"
						tabIndex={isEnabled ? 0 : -1}
						aria-label={`Select ${leftDetails.name}`}
						aria-pressed={selectedOption === "left"}
						onClick={() => {
							if (isEnabled) {
								createRipple("left");
								playSound("gameboy-pluck");
								onNameCardClick("left");
							}
						}}
						onKeyDown={(e) => {
							if (isEnabled && (e.key === "Enter" || e.key === " ")) {
								e.preventDefault();
								createRipple("left");
								playSound("gameboy-pluck");
								onNameCardClick("left");
							}
						}}
					>
						<div className={styles.spikes} aria-hidden="true" />
						{/* Ripple Effects */}
						<AnimatePresence>
							{ripples
								.filter((ripple) => ripple.side === "left")
								.map((ripple) => (
									<motion.div
										key={ripple.id}
										className={styles.ripple}
										initial={{ scale: 0, opacity: 1 }}
										animate={{ scale: 2.5, opacity: 0 }}
										exit={{ opacity: 0 }}
										transition={{ duration: 0.8, ease: "easeOut" }}
									/>
								))}
						</AnimatePresence>
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
						<AnimatePresence>
							{showVoteConfirmation === "left" && (
								<motion.div
									initial={{
										opacity: 0,
										scale: 0,
										rotate: -180,
										y: -20,
									}}
									animate={{
										opacity: 1,
										scale: 1,
										rotate: 0,
										y: 0,
									}}
									exit={{
										opacity: 0,
										scale: 0.8,
										rotate: 180,
										y: 20,
										transition: { duration: 0.4 },
									}}
									transition={{
										duration: 0.6,
										type: "spring",
										stiffness: 300,
										damping: 20,
									}}
									className={styles.voteCheckmark}
									aria-label="Vote confirmed"
								>
									✓
								</motion.div>
							)}
						</AnimatePresence>
					</motion.div>

					{/* VS Text */}
					<div className={styles.vsCore} aria-hidden="true">
						<div className={styles.vsText}>VS</div>
					</div>

					{/* Right Fighter Orb */}
					<motion.div
						ref={rightOrbRef}
						layout={true}
						drag={isEnabled ? "x" : false}
						dragConstraints={{ left: 0, right: 0 }}
						dragElastic={0.2}
						onDragEnd={(_, info) => handleDragEnd("right", info)}
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						whileHover={isEnabled ? { scale: 1.02 } : {}}
						whileTap={isEnabled ? { scale: 0.98 } : {}}
						transition={{ duration: 0.2, ease: "easeOut" }}
						className={`${styles.fighterOrb} ${styles.right} ${selectedOption === "right" ? styles.selected : ""} ${isEnabled ? "" : styles.disabled}`}
						role="button"
						tabIndex={isEnabled ? 0 : -1}
						aria-label={`Select ${rightDetails.name}`}
						aria-pressed={selectedOption === "right"}
						onClick={() => {
							if (isEnabled) {
								createRipple("right");
								playSound("gameboy-pluck");
								onNameCardClick("right");
							}
						}}
						onKeyDown={(e) => {
							if (isEnabled && (e.key === "Enter" || e.key === " ")) {
								e.preventDefault();
								createRipple("right");
								playSound("gameboy-pluck");
								onNameCardClick("right");
							}
						}}
					>
						<div className={styles.spikes} aria-hidden="true" />
						{/* Ripple Effects */}
						<AnimatePresence>
							{ripples
								.filter((ripple) => ripple.side === "right")
								.map((ripple) => (
									<motion.div
										key={ripple.id}
										className={styles.ripple}
										initial={{ scale: 0, opacity: 1 }}
										animate={{ scale: 2.5, opacity: 0 }}
										exit={{ opacity: 0 }}
										transition={{ duration: 0.8, ease: "easeOut" }}
									/>
								))}
						</AnimatePresence>
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
						<AnimatePresence>
							{showVoteConfirmation === "right" && (
								<motion.div
									initial={{
										opacity: 0,
										scale: 0,
										rotate: -180,
										y: -20,
									}}
									animate={{
										opacity: 1,
										scale: 1,
										rotate: 0,
										y: 0,
									}}
									exit={{
										opacity: 0,
										scale: 0.8,
										rotate: 180,
										y: 20,
										transition: { duration: 0.4 },
									}}
									transition={{
										duration: 0.6,
										type: "spring",
										stiffness: 300,
										damping: 20,
									}}
									className={styles.voteCheckmark}
									aria-label="Vote confirmed"
								>
									✓
								</motion.div>
							)}
						</AnimatePresence>
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
