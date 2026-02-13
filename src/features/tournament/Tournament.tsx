import { memo, useCallback, useEffect, useState } from "react";
import { Card } from "@/layout/Card";
import { ErrorComponent, Loading } from "@/layout/FeedbackComponents";
import { useToast } from "@/providers/Providers";
import { CAT_IMAGES, getRandomCatImage } from "@/services/tournament";
import useAppStore from "@/store/appStore";
import type { TournamentProps } from "@/types/appTypes";
import { getVisibleNames } from "@/utils/basic";
import CatImage from "./components/CatImage";
import { useAudioManager } from "./hooks/useAudioManager";
import { useTournamentState } from "./hooks/useTournamentState";
import { useTournamentVote } from "./hooks/useTournamentVote";

function TournamentContent({ onComplete, names = [], onVote }: TournamentProps) {
	const { showSuccess, showError } = useToast();
	const visibleNames = getVisibleNames(names);
	const audioManager = useAudioManager();

	const tournament = useTournamentState(visibleNames);
	const {
		currentMatch,
		ratings,
		handleVote: handleVoteInternal,
		isComplete,
		round: roundNumber,
		matchNumber: currentMatchNumber,
		totalMatches,
		handleUndo,
	} = tournament;

	const [_selectedOption, setSelectedOption] = useState<"left" | "right" | null>(null);
	const [isTransitioning, setIsTransitioning] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [_lastMatchResult, setLastMatchResult] = useState<string | null>(null);
	const [_showMatchResult, setShowMatchResult] = useState(false);
	const [_votingError, setVotingError] = useState<unknown>(null);

	const handleVote = useCallback(
		(winnerId: string, loserId: string) => {
			handleVoteInternal(winnerId, loserId);
			onVote?.(winnerId, loserId);
		},
		[handleVoteInternal, onVote],
	);

	useEffect(() => {
		if (isComplete && onComplete) {
			const results = Object.entries(ratings).map(([name, rating]) => ({
				name,
				rating,
			}));
			onComplete(results as any);
		}
	}, [isComplete, ratings, onComplete]);

	const { handleVoteWithAnimation } = useTournamentVote({
		tournamentState: tournament,
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
	} as any); // Casting as any to bypass complex type matching for now, relying on correct prop usage inside hook

	const showCatPictures = useAppStore((state) => state.ui.showCatPictures);
	const setCatPictures = useAppStore((state) => state.uiActions.setCatPictures);

	if (!currentMatch) {
		return (
			<div className="flex items-center justify-center min-h-[500px]">
				<Loading variant="spinner" />
			</div>
		);
	}

	const handleLeftClick = () => {
		const winnerId =
			typeof currentMatch.left === "object"
				? String(currentMatch.left.id)
				: String(currentMatch.left);
		const loserId =
			typeof currentMatch.right === "object"
				? String(currentMatch.right.id)
				: String(currentMatch.right);
		handleVoteWithAnimation(winnerId, loserId);
	};

	const handleRightClick = () => {
		const winnerId =
			typeof currentMatch.right === "object"
				? String(currentMatch.right.id)
				: String(currentMatch.right);
		const loserId =
			typeof currentMatch.left === "object"
				? String(currentMatch.left.id)
				: String(currentMatch.left);
		handleVoteWithAnimation(winnerId, loserId);
	};

	// No images shown - gallery images removed from tournament view
	const leftImg = showCatPictures
		? getRandomCatImage(
				typeof currentMatch.left === "object" ? currentMatch.left.id : currentMatch.left,
				CAT_IMAGES,
			)
		: null;
	const rightImg = showCatPictures
		? getRandomCatImage(
				typeof currentMatch.right === "object" ? currentMatch.right.id : currentMatch.right,
				CAT_IMAGES,
			)
		: null;

	return (
		<div className="relative min-h-screen w-full flex flex-col overflow-hidden max-w-[430px] mx-auto border-x border-white/5 font-display text-white selection:bg-primary/30">
			{/* Header */}
			<header className="pt-6 px-4 space-y-4">
				<div className="flex items-center justify-between">
					<div className="px-4 py-1.5 rounded-full flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20">
						<span className="material-symbols-outlined text-primary text-sm">stars</span>
						<span className="text-xs font-bold tracking-widest uppercase text-white/90">
							Round {roundNumber}
						</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="material-symbols-outlined text-stardust">workspace_premium</span>
						<span className="text-xs font-bold">
							{currentMatchNumber} / {totalMatches}
						</span>
					</div>
				</div>
				<div className="flex flex-col gap-2">
					<div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
						<div
							className="h-full bg-primary rounded-full shadow-[0_0_10px_#a65eed]"
							style={{ width: `${(currentMatchNumber / totalMatches) * 100}%` }}
						/>
					</div>
				</div>
			</header>

			{/* Controls */}
			<section className="mt-6 px-4">
				<Card
					className="flex flex-row items-center justify-between"
					padding="small"
					variant="default"
				>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={audioManager.handleToggleMute}
							className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 text-white/60 hover:text-white transition-colors"
							aria-label={audioManager.isMuted ? "Unmute audio" : "Mute audio"}
							aria-pressed={!audioManager.isMuted}
							title={audioManager.isMuted ? "Unmute audio" : "Mute audio"}
						>
							<span className="material-symbols-outlined">
								{audioManager.isMuted ? "volume_off" : "volume_up"}
							</span>
						</button>
					</div>
					<button
						type="button"
						onClick={() => setCatPictures(!showCatPictures)}
						className={`flex items-center gap-2 px-4 h-10 rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg ${showCatPictures ? "bg-primary shadow-primary/20" : "bg-white/10"}`}
						aria-pressed={showCatPictures}
						title={showCatPictures ? "Hide cat pictures" : "Show cat pictures"}
					>
						<span className="material-symbols-outlined text-sm">pets</span>
						<span>{showCatPictures ? "Names Only" : "Show Cats"}</span>
					</button>
				</Card>
			</section>

			{/* Battle Area */}
			<main className="flex-1 flex flex-col items-center justify-center px-4 relative my-4">
				<div className="relative grid grid-cols-2 gap-4 w-full h-full max-h-[500px]">
					{/* Left */}
					<Card
						interactive={true}
						onClick={handleLeftClick}
						className="flex flex-col items-center justify-between relative overflow-hidden group cursor-pointer h-full"
						variant="default"
					>
						<div className="w-full aspect-square rounded-xl overflow-hidden mb-4 bg-white/10 flex items-center justify-center relative">
							{leftImg ? (
								<CatImage
									src={leftImg}
									alt={
										typeof currentMatch.left === "object"
											? currentMatch.left?.name
											: currentMatch.left
									}
									containerClassName="w-full h-full"
									imageClassName="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
								/>
							) : (
								<span className="text-white/20 text-6xl font-bold select-none">
									{typeof currentMatch.left === "object" && currentMatch.left?.name
										? currentMatch.left.name[0]?.toUpperCase() || "?"
										: "?"}
								</span>
							)}
						</div>
						<div className="text-center pb-4 z-10 w-full">
							<h3 className="font-whimsical text-2xl text-white tracking-wide break-words w-full">
								{typeof currentMatch.left === "object"
									? currentMatch.left?.name
									: currentMatch.left}
							</h3>
						</div>
					</Card>

					{/* VS */}
					<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
						<div className="size-14 rounded-full flex items-center justify-center border-2 border-white/30 bg-primary/20 backdrop-blur-md shadow-lg">
							<span className="font-bold text-xl italic tracking-tighter">VS</span>
						</div>
					</div>

					{/* Right */}
					<Card
						interactive={true}
						onClick={handleRightClick}
						className="flex flex-col items-center justify-between relative overflow-hidden group cursor-pointer h-full"
						variant="default"
					>
						<div className="w-full aspect-square rounded-xl overflow-hidden mb-4 bg-white/10 flex items-center justify-center relative">
							{rightImg ? (
								<CatImage
									src={rightImg}
									alt={
										typeof currentMatch.right === "object"
											? currentMatch.right?.name
											: currentMatch.right
									}
									containerClassName="w-full h-full"
									imageClassName="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
								/>
							) : (
								<span className="text-white/20 text-6xl font-bold select-none">
									{typeof currentMatch.right === "object" && currentMatch.right?.name
										? currentMatch.right.name[0]?.toUpperCase() || "?"
										: "?"}
								</span>
							)}
						</div>
						<div className="text-center pb-4 z-10 w-full">
							<h3 className="font-whimsical text-2xl text-white tracking-wide break-words w-full">
								{typeof currentMatch.right === "object"
									? currentMatch.right?.name
									: currentMatch.right}
							</h3>
						</div>
					</Card>
				</div>

				{/* Undo */}
				<button
					type="button"
					onClick={handleUndo}
					className="mt-6 glass-panel py-2 px-6 rounded-full flex items-center gap-3 border border-primary/20 cursor-pointer hover:bg-white/5 transition-colors"
				>
					<span className="material-symbols-outlined text-sm text-primary">undo</span>
					<span className="text-[10px] font-bold text-white/60 tracking-widest uppercase">
						Undo
					</span>
				</button>
			</main>

			{/* Background */}
			<div className="absolute top-[-10%] left-[-10%] size-64 bg-primary/10 rounded-full blur-[100px] -z-10" />
			<div className="absolute bottom-[-10%] right-[-10%] size-64 bg-stardust/10 rounded-full blur-[100px] -z-10" />
		</div>
	);
}

const MemoizedTournament = memo(TournamentContent);

export default function Tournament(props: TournamentProps) {
	return (
		<ErrorComponent variant="boundary">
			<MemoizedTournament {...props} />
		</ErrorComponent>
	);
}
