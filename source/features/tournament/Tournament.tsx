import { useState } from "react";
import { ErrorComponent } from "../../shared/components/ErrorComponent";
import { Loading } from "../../shared/components/Loading";
import { useToast } from "../../shared/providers/ToastProvider";
import { getVisibleNames } from "../../shared/utils";
import type { TournamentProps } from "../../types/components";
import { useAudioManager, useTournamentState, useTournamentVote } from "./TournamentHooks";
import { CAT_IMAGES, getRandomCatImage } from "./TournamentLogic";
import styles from "./tournament.module.css";

function TournamentContent({
	onComplete,
	existingRatings = {},
	names = [],
	onVote,
}: TournamentProps) {
	const { showSuccess, showError } = useToast();
	const visibleNames = getVisibleNames(names);
	const audioManager = useAudioManager();

	const {
		// selectedOption,
		setSelectedOption,
		isTransitioning,
		setIsTransitioning,
		isProcessing,
		setIsProcessing,
		setLastMatchResult,
		setShowMatchResult,
		setVotingError,
		handleVote,
		tournament,
	} = useTournamentState(visibleNames, existingRatings, onComplete, onVote);

	const { currentMatch, progress, roundNumber, currentMatchNumber, totalMatches, handleUndo } =
		tournament;

	const { handleVoteWithAnimation } = useTournamentVote({
		isProcessing,
		isTransitioning,
		currentMatch,
		handleVote,
		onVote,
		audioManager,
		setIsProcessing,
		setIsTransitioning,
		setSelectedOption,
		setVotingError,
		setLastMatchResult,
		setShowMatchResult,
		showSuccess,
		showError,
	});

	const [showCatPictures, setShowCatPictures] = useState(true);

	if (!currentMatch) {
		return (
			<div className="flex items-center justify-center min-h-[500px]">
				<Loading variant="spinner" />
			</div>
		);
	}

	// Prepare images
	const leftImg =
		showCatPictures && currentMatch?.left && typeof currentMatch.left !== "string"
			? getRandomCatImage(currentMatch.left.id, CAT_IMAGES)
			: null;
	const rightImg =
		showCatPictures && currentMatch?.right && typeof currentMatch.right !== "string"
			? getRandomCatImage(currentMatch.right.id, CAT_IMAGES)
			: null;

	return (
		<div
			className={`relative min-h-screen w-full flex flex-col overflow-hidden max-w-[430px] mx-auto border-x border-white/5 shadow-2xl font-display text-white selection:bg-primary/30 ${styles.starBg}`}
		>
			{/* Header Section */}
			<header className="pt-6 px-4 space-y-4">
				<div className="flex items-center justify-between">
					<div className={`px-4 py-1.5 rounded-full flex items-center gap-2 ${styles.glassPanel}`}>
						<span className="material-symbols-outlined text-primary text-sm">stars</span>
						<span className="text-xs font-bold tracking-widest uppercase text-white/90">
							Round {roundNumber}
						</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="material-symbols-outlined text-stardust">workspace_premium</span>
						<span className="text-xs font-bold">{progress}</span>
					</div>
				</div>
				<div className="flex flex-col gap-2">
					<div className="flex justify-between items-end px-1">
						<p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold">
							Tournament Progress
						</p>
						<p className="text-[10px] font-bold text-primary">
							{currentMatchNumber}/{totalMatches}
						</p>
					</div>
					<div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
						<div
							className="h-full bg-primary rounded-full shadow-[0_0_10px_#a65eed]"
							style={{ width: `${(currentMatchNumber / totalMatches) * 100}%` }}
						></div>
					</div>
				</div>
			</header>

			{/* Tournament Controls */}
			<section className="mt-6 px-4">
				<div className={`p-2 rounded-xl flex items-center justify-between ${styles.glassPanel}`}>
					<div className="flex gap-2">
						<button
							onClick={audioManager.handleToggleMute}
							className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 text-white/60 hover:text-white transition-colors"
						>
							<span className="material-symbols-outlined">
								{audioManager.isMuted ? "volume_off" : "volume_up"}
							</span>
						</button>
						<button
							onClick={() => {
								/* Skip functionality not implemented */
							}}
							className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 text-white/60 hover:text-white transition-colors"
						>
							<span className="material-symbols-outlined">skip_next</span>
						</button>
					</div>
					<button
						onClick={() => setShowCatPictures(!showCatPictures)}
						className={`flex items-center gap-2 px-4 h-10 rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg ${showCatPictures ? "bg-primary shadow-primary/20" : "bg-white/10"}`}
					>
						<span className="material-symbols-outlined text-sm">pets</span>
						<span>Cats: {showCatPictures ? "On" : "Off"}</span>
					</button>
				</div>
			</section>

			{/* Battle Main Area */}
			<main className="flex-1 flex flex-col items-center justify-center px-4 relative my-4">
				<div className="relative grid grid-cols-2 gap-4 w-full h-full max-h-[500px]">
					{/* Card Left */}
					<div
						onClick={() => handleVoteWithAnimation("left")}
						className={`rounded-2xl flex flex-col items-center justify-between p-4 relative overflow-hidden group cursor-pointer border-t border-white/20 transition-all active:scale-95 ${styles.glassPanel}`}
					>
						<div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
						<div
							className={`w-full aspect-square rounded-xl overflow-hidden border-0 mb-4 ${styles.glassPanel}`}
						>
							{leftImg && (
								<div
									className="w-full h-full bg-cover bg-center opacity-80 group-hover:scale-110 transition-transform duration-700"
									style={{ backgroundImage: `url('${leftImg}')` }}
								/>
							)}
						</div>
						<div className="text-center pb-4 z-10">
							<h3 className="font-whimsical text-2xl lg:text-3xl text-white tracking-wide drop-shadow-lg break-words w-full">
								{typeof currentMatch.left === "object"
									? currentMatch.left?.name
									: currentMatch.left}
							</h3>
							<p className="text-[10px] text-stardust font-bold tracking-widest mt-1 opacity-60">
								CHALLENGER
							</p>
						</div>
					</div>

					{/* VS Badge */}
					<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
						<div
							className={`size-14 rounded-full flex items-center justify-center border-2 border-white/30 ${styles.vsBadge}`}
						>
							<span className="font-bold text-xl italic tracking-tighter">VS</span>
						</div>
					</div>

					{/* Card Right */}
					<div
						onClick={() => handleVoteWithAnimation("right")}
						className={`rounded-2xl flex flex-col items-center justify-between p-4 relative overflow-hidden group cursor-pointer border-t border-white/20 transition-all active:scale-95 ${styles.glassPanel}`}
					>
						<div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
						<div
							className={`w-full aspect-square rounded-xl overflow-hidden border-0 mb-4 ${styles.glassPanel}`}
						>
							{rightImg && (
								<div
									className="w-full h-full bg-cover bg-center opacity-80 group-hover:scale-110 transition-transform duration-700"
									style={{ backgroundImage: `url('${rightImg}')` }}
								/>
							)}
						</div>
						<div className="text-center pb-4 z-10">
							<h3 className="font-whimsical text-2xl lg:text-3xl text-white tracking-wide drop-shadow-lg break-words w-full">
								{typeof currentMatch.right === "object"
									? currentMatch.right?.name
									: currentMatch.right}
							</h3>
							<p className="text-[10px] text-stardust font-bold tracking-widest mt-1 opacity-60">
								DEFENDER
							</p>
						</div>
					</div>
				</div>

				{/* Undo Banner */}
				<div
					onClick={handleUndo}
					className="mt-6 glass-panel py-2 px-6 rounded-full flex items-center gap-3 border border-primary/20 cursor-pointer hover:bg-white/5 transition-colors"
				>
					<span className="material-symbols-outlined text-sm text-primary">undo</span>
					<span className="text-[10px] font-bold text-white/60 tracking-widest uppercase">
						Tap to undo last pick
					</span>
				</div>
			</main>

			{/* Bottom Navigation */}
			<nav className="pb-8 px-6">
				<div
					className={`rounded-2xl flex items-center justify-around py-3 px-2 border-t border-white/10 ${styles.glassPanel}`}
				>
					<button className="flex flex-col items-center gap-1 group">
						<div className="size-10 rounded-xl flex items-center justify-center bg-primary shadow-[0_0_15px_rgba(166,94,237,0.4)]">
							<span className="material-symbols-outlined text-white fill-1">bolt</span>
						</div>
						<span className="text-[9px] font-bold text-primary uppercase tracking-tighter">
							Pick
						</span>
					</button>
					{/* Placeholder buttons for navigation - can be hooked up to routing if needed */}
					<button className="flex flex-col items-center gap-1 group text-white/40 hover:text-white transition-colors">
						<div className="size-10 flex items-center justify-center">
							<span className="material-symbols-outlined">grid_view</span>
						</div>
						<span className="text-[9px] font-bold uppercase tracking-tighter">Gallery</span>
					</button>
					<button className="flex flex-col items-center gap-1 group text-white/40 hover:text-white transition-colors">
						<div className="size-10 flex items-center justify-center">
							<span className="material-symbols-outlined">group</span>
						</div>
						<span className="text-[9px] font-bold uppercase tracking-tighter">Pick 2+</span>
					</button>
					<button className="flex flex-col items-center gap-1 group text-white/40 hover:text-white transition-colors">
						<div className="size-10 flex items-center justify-center">
							<span className="material-symbols-outlined">auto_awesome</span>
						</div>
						<span className="text-[9px] font-bold uppercase tracking-tighter">Suggest</span>
					</button>
				</div>
			</nav>

			{/* Background Aesthetic Elements */}
			<div className="absolute top-[-10%] left-[-10%] size-64 bg-primary/10 rounded-full blur-[100px] -z-10"></div>
			<div className="absolute bottom-[-10%] right-[-10%] size-64 bg-stardust/10 rounded-full blur-[100px] -z-10"></div>
		</div>
	);
}

export default function Tournament(props: TournamentProps) {
	return (
		<ErrorComponent variant="boundary">
			<TournamentContent {...props} />
		</ErrorComponent>
	);
}
