import { AlertCircle, Music, Volume2, VolumeX } from "lucide-react";
import React, { useState } from "react";
import Button, { IconButton } from "../../../shared/components/Button";
import LiquidGlass from "../../../shared/components/LiquidGlass/LiquidGlass";
import styles from "../styles/Tournament.module.css";

interface TournamentControlsProps {
	onEndEarly: () => void;
	isTransitioning: boolean;
	isMuted: boolean;
	onToggleMute: () => void;
	onNextTrack: () => void;
	isShuffle: boolean;
	onToggleShuffle: () => void;
	trackInfo?: {
		name?: string;
		[key: string]: unknown;
	} | null;
	audioError?: string | null;
	onRetryAudio: () => void;
	volume: {
		music: number;
		effects: number;
	};
	onVolumeChange: (type: "music" | "effects", value: number) => void;
	showCatPictures: boolean;
	onToggleCatPictures: () => void;
}

const TournamentControls = ({
	onEndEarly,
	isTransitioning,
	isMuted,
	onToggleMute,
	onNextTrack,
	isShuffle,
	onToggleShuffle,
	trackInfo,
	audioError,
	onRetryAudio,
	volume,
	onVolumeChange,
	showCatPictures,
	onToggleCatPictures,
}: TournamentControlsProps) => {
	const [showConfirmation, setShowConfirmation] = useState(false);
	const [showVolume, setShowVolume] = useState(false);

	const handleEndConfirm = () => {
		setShowConfirmation(false);
		onEndEarly();
	};

	return (
		<LiquidGlass
			width={1200}
			height={140}
			radius={28}
			scale={-95}
			saturation={1.06}
			frost={0.12}
			outputBlur={0.8}
			className={styles.tournamentControlsGlass}
			style={{ width: "100%", height: "auto", padding: 0 }}
		>
			<div className={styles.tournamentControls} role="toolbar" aria-label="Tournament controls">
				<div className={styles.soundControls}>
					<IconButton
						onClick={audioError ? onRetryAudio : onToggleMute}
						icon={
							isMuted ? (
								<VolumeX className={styles.icon} aria-hidden="true" />
							) : (
								<Volume2 className={styles.icon} aria-hidden="true" />
							)
						}
						variant={audioError ? "danger" : "ghost"}
						ariaLabel={isMuted ? "Unmute tournament sounds" : "Mute tournament sounds"}
						aria-pressed={isMuted}
						disabled={isTransitioning}
						title={isMuted ? "Unmute" : "Mute"}
						className={`${styles.soundToggleButton} ${isMuted ? styles.muted : ""} ${audioError ? styles.error : ""}`}
					/>

					{!isMuted && (
						<div
							className={styles.volumeContainer}
							onMouseEnter={() => setShowVolume(true)}
							onMouseLeave={() => setShowVolume(false)}
						>
							<div className={`${styles.volumeControls} ${showVolume ? styles.show : ""}`}>
								<label className={styles.volumeLabel}>
									🎵
									<input
										type="range"
										min="0"
										max="1"
										step="0.1"
										value={volume.music}
										onChange={(e) => onVolumeChange("music", parseFloat(e.target.value))}
										className={styles.volumeSlider}
									/>
								</label>
								<label className={styles.volumeLabel}>
									🎮
									<input
										type="range"
										min="0"
										max="1"
										step="0.1"
										value={volume.effects}
										onChange={(e) => onVolumeChange("effects", parseFloat(e.target.value))}
										className={styles.volumeSlider}
									/>
								</label>
							</div>
						</div>
					)}

					{!isMuted && (
						<IconButton
							onClick={onNextTrack}
							icon={<Music className={styles.icon} aria-hidden="true" />}
							variant="ghost"
							ariaLabel="Next track"
							disabled={isTransitioning}
							title={
								trackInfo ? `Now Playing: ${trackInfo.name}\nClick for next track` : "Next track"
							}
							className={styles.soundToggleButton}
						/>
					)}

					{!isMuted && (
						<IconButton
							onClick={onToggleShuffle}
							icon={
								<span className={styles.icon} aria-hidden="true">
									🔀
								</span>
							}
							variant="ghost"
							ariaLabel={isShuffle ? "Disable shuffle" : "Enable shuffle"}
							aria-pressed={isShuffle}
							disabled={isTransitioning}
							title={
								isShuffle ? "Shuffle: On (toggle to turn off)" : "Shuffle: Off (toggle to turn on)"
							}
							className={`${styles.soundToggleButton} ${isShuffle ? styles.muted : ""}`}
						/>
					)}

					<IconButton
						onClick={onToggleCatPictures}
						icon={
							<span className={styles.icon} aria-hidden="true">
								🐱
							</span>
						}
						variant="ghost"
						ariaLabel={showCatPictures ? "Hide cat pictures" : "Show cat pictures"}
						aria-pressed={showCatPictures}
						disabled={isTransitioning}
						title={showCatPictures ? "🐱 Hide Cats" : "🐱 Show Cats"}
						className={`${styles.soundToggleButton} ${showCatPictures ? styles.muted : ""}`}
					/>

					{audioError && (
						<IconButton
							onClick={onRetryAudio}
							icon={<AlertCircle className={styles.icon} aria-hidden="true" />}
							variant="danger"
							ariaLabel="Retry playing audio"
							title={audioError}
							className={`${styles.soundToggleButton} ${styles.error}`}
						/>
					)}

					{!isMuted && trackInfo && trackInfo.name && (
						<div className={styles.trackInfo} aria-live="polite">
							<span className={styles.trackName}>{trackInfo.name}</span>
						</div>
					)}
				</div>

				<Button
					onClick={() => setShowConfirmation(true)}
					variant="danger"
					size="large"
					disabled={isTransitioning}
					className={styles.controlButton}
					aria-label="End tournament early"
				>
					End Tournament Early
				</Button>

				{showConfirmation && (
					<>
						<div
							className={styles.modalBackdrop}
							onClick={() => setShowConfirmation(false)}
							aria-hidden="true"
						/>
						<div
							className={styles.modal}
							role="dialog"
							aria-labelledby="confirm-end-title"
							aria-describedby="confirm-end-description"
						>
							<h2 id="confirm-end-title" className={styles.modalTitle}>
								End Tournament?
							</h2>
							<p id="confirm-end-description" className={styles.modalText}>
								Are you sure you want to end the tournament early? Your progress will be saved, but
								you won't be able to continue voting.
							</p>
							<div className={styles.modalActions}>
								<Button
									onClick={handleEndConfirm}
									variant="danger"
									autoFocus={true}
									className={styles.confirmButton}
								>
									Yes, End Tournament
								</Button>
								<Button
									onClick={() => setShowConfirmation(false)}
									variant="secondary"
									className={styles.cancelButton}
								>
									Cancel
								</Button>
							</div>
						</div>
					</>
				)}
			</div>
		</LiquidGlass>
	);
};

// ts-prune-ignore-next (used in Tournament)
export default React.memo(TournamentControls);
