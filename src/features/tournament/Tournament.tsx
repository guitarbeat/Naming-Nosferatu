import { memo, useCallback, useEffect, useMemo } from "react";
import { Card } from "@/layout/Card";
import { ErrorComponent } from "@/layout/FeedbackComponents";
import useAppStore from "@/store/appStore";
import type { TournamentProps, NameItem } from "@/types/appTypes";
import { getRandomCatImage, getVisibleNames, exportTournamentResultsToCSV } from "@/utils/basic";
import { CAT_IMAGES } from "@/utils/constants";
import CatImage from "./components/CatImage";
import { useAudioManager } from "./hooks/useHelpers";
import { useTournamentState } from "./hooks/useTournamentState";
import { useTournamentVote } from "./hooks/useTournamentVote";

function TournamentContent({ onComplete, names = [], onVote }: TournamentProps) {
	const { user } = useAppStore();
	const visibleNames = getVisibleNames(names);
	const audioManager = useAudioManager();

	const tournament = useTournamentState(visibleNames, user.name);
	const {
		currentMatch,
		ratings,
		isComplete,
		round: roundNumber,
		matchNumber: currentMatchNumber,
		totalMatches,
		handleUndo,
		handleQuit,
		progress,
		etaMinutes = 0,
	} = tournament;

	// Adapter to convert VoteData to winnerId/loserId for the hook
	const handleVoteAdapter = useCallback(
		(winnerId: string, _loserId: string) => {
			if (onVote && currentMatch) {
				const leftId = String(
					typeof currentMatch.left === "object" ? currentMatch.left.id : currentMatch.left,
				);
				const rightId = String(
					typeof currentMatch.right === "object" ? currentMatch.right.id : currentMatch.right,
				);
				const leftName =
					typeof currentMatch.left === "object" ? currentMatch.left.name : currentMatch.left;
				const rightName =
					typeof currentMatch.right === "object" ? currentMatch.right.name : currentMatch.right;

				const voteData = {
					match: {
						left: {
							name: leftName,
							id: leftId,
							description: "",
							outcome: winnerId === leftId ? "winner" : "loser",
						},
						right: {
							name: rightName,
							id: rightId,
							description: "",
							outcome: winnerId === rightId ? "winner" : "loser",
						},
					},
					result: winnerId === leftId ? 1 : 0,
					ratings,
					timestamp: new Date().toISOString(),
				};
				onVote(voteData);
			}
		},
		[onVote, currentMatch, ratings],
	);

	const idToName = useMemo(
		() => new Map(visibleNames.map((n) => [String(n.id), n.name])),
		[visibleNames],
	);

	// idToName memoizes based on visibleNames, so tracking idToName implicitly tracks visibleNames
	useEffect(() => {
		if (isComplete && onComplete) {
			// Play celebration sounds!
			audioManager.playLevelUpSound();
			setTimeout(() => audioManager.playWowSound(), 500);
			
			const results: Record<string, { rating: number; wins: number; losses: number }> = {};
			const nameItems: NameItem[] = [];
			
			for (const [id, rating] of Object.entries(ratings)) {
				const name = idToName.get(id) ?? id;
				results[name] = { rating, wins: 0, losses: 0 };
				nameItems.push({
					id,
					name,
					rating,
					wins: 0,
					losses: 0
				} as NameItem);
			}
			
			// Auto-export results to CSV
			exportTournamentResultsToCSV(nameItems, `tournament_results_${new Date().toISOString().slice(0, 10)}.csv`);
			
			onComplete(results);
		}
	}, [isComplete, ratings, onComplete, idToName, audioManager]);

	const { handleVoteWithAnimation } = useTournamentVote({
		tournamentState: tournament,
		audioManager,
		onVote: handleVoteAdapter,
	});

	const showCatPictures = useAppStore((state) => state.ui.showCatPictures);
	const setCatPictures = useAppStore((state) => state.uiActions.setCatPictures);

	if (isComplete) {
		return (
			<div className="relative min-h-screen w-full flex flex-col overflow-hidden font-display text-white selection:bg-primary/30">
				{/* Celebration background */}
				<div className="absolute inset-0 overflow-hidden pointer-events-none">
					<div className="absolute top-0 left-0 w-40 h-40 bg-green-500/20 rounded-full animate-blob animation-delay-2000" />
					<div className="absolute top-1/3 right-0 w-32 h-32 bg-primary/20 rounded-full animate-blob" />
					<div className="absolute bottom-1/4 left-1/4 w-36 h-36 bg-yellow-500/20 rounded-full animate-blob animation-delay-4000" />
					<div className="absolute bottom-0 right-1/3 w-44 h-44 bg-green-500/15 rounded-full animate-blob animation-delay-2000" />
				</div>

				<div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
					<Card className="max-w-2xl w-full text-center p-8" variant="default">
						<div className="mb-6">
							<span className="material-symbols-outlined text-6xl text-green-400">emoji_events</span>
						</div>
						<h1 className="font-whimsical text-4xl text-white tracking-wide mb-4">
							Tournament Complete!
						</h1>
						<p className="text-white/80 mb-6">
							Congratulations! Your tournament results have been downloaded as a CSV file.
						</p>
						
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4 text-left">
								<div className="bg-white/5 rounded-lg p-4">
									<div className="text-sm text-white/60 mb-1">Total Matches</div>
									<div className="text-xl font-bold text-white">{totalMatches}</div>
								</div>
								<div className="bg-white/5 rounded-lg p-4">
									<div className="text-sm text-white/60 mb-1">Participants</div>
									<div className="text-xl font-bold text-white">{visibleNames.length}</div>
								</div>
							</div>
							
							<div className="flex flex-col gap-3 pt-4">
								<button
									onClick={() => window.location.reload()}
									className="w-full glass-panel py-3 px-6 rounded-full flex items-center justify-center gap-3 border border-primary/20 cursor-pointer hover:bg-white/5 transition-colors"
								>
									<span className="material-symbols-outlined text-primary">refresh</span>
									<span className="font-bold text-white">Start New Tournament</span>
								</button>
								
								{onComplete && (
									<button
										onClick={() => onComplete({})}
										className="w-full glass-panel py-3 px-6 rounded-full flex items-center justify-center gap-3 border border-white/20 cursor-pointer hover:bg-white/5 transition-colors"
									>
										<span className="material-symbols-outlined text-white">home</span>
										<span className="font-bold text-white">Back to Main Menu</span>
									</button>
								)}
							</div>
						</div>
					</Card>
				</div>
			</div>
		);
	}

	if (!currentMatch) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-white/60">Loading tournament...</div>
			</div>
		);
	}

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
		<div className="relative min-h-screen w-full flex flex-col overflow-hidden font-display text-white selection:bg-primary/30">
			<header className="pt-4 px-6 space-y-3 flex-shrink-0">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="px-4 py-1.5 rounded-full flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20">
							<span className="material-symbols-outlined text-primary text-sm">sports_esports</span>
							<span className="text-xs font-bold tracking-widest uppercase text-white/90">
								{isComplete ? "Tournament Complete!" : `Round ${roundNumber}`}
							</span>
						</div>
						{isComplete && (
							<div className="px-3 py-1 rounded-full flex items-center gap-2 bg-green-500/20 border border-green-500/30">
								<span className="material-symbols-outlined text-green-400 text-sm">celebration</span>
								<span className="text-xs font-bold text-green-400">
									Results Downloaded
								</span>
							</div>
						)}
					</div>
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2">
							<span className="material-symbols-outlined text-stardust">workspace_premium</span>
							<span className="text-xs font-bold">
								{currentMatchNumber} / {totalMatches}
							</span>
						</div>
						{etaMinutes > 0 && !isComplete && (
							<div className="flex items-center gap-1 text-xs text-white/60">
								<span className="material-symbols-outlined text-sm">schedule</span>
								<span>~{etaMinutes}m</span>
							</div>
						)}
					</div>
				</div>
				<div className="flex flex-col gap-2">
					<div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
						<div
							className={`h-full rounded-full shadow-[0_0_10px_#a65eed] transition-all duration-500 ${
								isComplete ? "bg-green-500" : "bg-primary"
							}`}
							style={{ width: `${progress || (currentMatchNumber / totalMatches) * 100}%` }}
						/>
					</div>
					<div className="text-center text-xs text-white/60">
						{isComplete ? (
							<span className="text-green-400 font-bold">🎉 Tournament Complete! 🎉</span>
						) : (
							<>{progress}% Complete</>
						)}
					</div>
				</div>
			</header>

			<section className="px-6 py-3 flex-shrink-0">
				<Card
					className="flex flex-row items-center justify-between"
					padding="small"
					variant="default"
				>
					<div className="flex gap-2 items-center">
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
						<input
							type="range"
							min="0"
							max="1"
							step="0.1"
							value={audioManager.volume}
							onChange={(e) => audioManager.handleVolumeChange(null, parseFloat(e.target.value))}
							className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
							aria-label="Volume control"
							title={`Volume: ${Math.round(audioManager.volume * 100)}%`}
						/>
						<button
							type="button"
							onClick={audioManager.handlePreviousTrack}
							className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-white/60 hover:text-white transition-colors"
							aria-label="Previous track"
							title="Previous track"
						>
							<span className="material-symbols-outlined text-sm">skip_previous</span>
						</button>
						<button
							type="button"
							onClick={audioManager.toggleBackgroundMusic}
							className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
								audioManager.backgroundMusicEnabled 
									? "bg-primary/20 text-primary" 
									: "bg-white/5 text-white/60 hover:text-white"
							}`}
							aria-label={audioManager.backgroundMusicEnabled ? "Stop background music" : "Play background music"}
							aria-pressed={audioManager.backgroundMusicEnabled}
							title={`${audioManager.backgroundMusicEnabled ? "Stop" : "Play"} background music: ${audioManager.currentTrack}`}
						>
							<span className="material-symbols-outlined text-sm">
								{audioManager.backgroundMusicEnabled ? "music_note" : "music_off"}
							</span>
						</button>
						<button
							type="button"
							onClick={audioManager.handleNextTrack}
							className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-white/60 hover:text-white transition-colors"
							aria-label="Next track"
							title="Next track"
						>
							<span className="material-symbols-outlined text-sm">skip_next</span>
						</button>
						{handleQuit && (
							<button
								type="button"
								onClick={handleQuit}
								className="w-10 h-10 flex items-center justify-center rounded-lg bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
								aria-label="Quit tournament"
								title="Quit tournament"
							>
								<span className="material-symbols-outlined">close</span>
							</button>
						)}
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

			<main className="flex-1 flex flex-col items-center justify-center px-6 relative py-4">
				{/* Animated blob backgrounds */}
				<div className="absolute inset-0 overflow-hidden pointer-events-none">
					<div className="absolute top-0 left-0 w-32 h-32 bg-primary/20 rounded-full animate-blob animation-delay-2000" />
					<div className="absolute top-1/4 right-0 w-24 h-24 bg-stardust/20 rounded-full animate-blob" />
					<div className="absolute bottom-1/4 left-1/4 w-28 h-28 bg-primary/15 rounded-full animate-blob animation-delay-4000" />
					<div className="absolute bottom-0 right-1/3 w-36 h-36 bg-stardust/15 rounded-full animate-blob animation-delay-2000" />
				</div>

				<div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-7xl mx-auto z-10 items-center">
					{/* Left Card */}
					<Card
						interactive={true}
						className="flex flex-col items-center justify-between relative overflow-hidden group cursor-pointer h-full min-h-[400px] animate-float"
						variant="default"
						onClick={() =>
							currentMatch &&
							handleVoteWithAnimation(
								String(
									typeof currentMatch.left === "object" ? currentMatch.left.id : currentMatch.left,
								),
								String(
									typeof currentMatch.right === "object"
										? currentMatch.right.id
										: currentMatch.right,
								),
							)
						}
					>
						<div className="w-full aspect-square rounded-xl overflow-hidden mb-4 bg-white/10 flex items-center justify-center relative max-w-sm">
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
						<div className="text-center pb-4 z-10 w-full px-4">
							<h3 className="font-whimsical text-2xl text-white tracking-wide break-words w-full mb-2">
								{typeof currentMatch.left === "object"
									? currentMatch.left?.name
									: currentMatch.left}
							</h3>
							{typeof currentMatch.left === "object" && currentMatch.left?.description && (
								<p className="text-sm text-white/60 italic line-clamp-2">
									{currentMatch.left.description}
								</p>
							)}
						</div>
					</Card>

					{/* VS Indicator */}
					<div className="flex flex-col items-center justify-center">
						<div className="size-20 rounded-full flex items-center justify-center border-2 border-white/30 bg-primary/20 backdrop-blur-md shadow-lg mb-4">
							<span className="font-bold text-2xl italic tracking-tighter">VS</span>
						</div>
						<div className="text-center space-y-3">
							<div className="text-xs text-white/60 uppercase tracking-wider">Choose Your Fighter</div>
							<div className="flex flex-col gap-2">
								<button
									type="button"
									onClick={() => handleUndo()}
									className="glass-panel py-2 px-6 rounded-full flex items-center gap-3 border border-primary/20 cursor-pointer hover:bg-white/5 transition-colors"
								>
									<span className="material-symbols-outlined text-sm text-primary">undo</span>
									<span className="text-[10px] font-bold text-white/60 tracking-widest uppercase">
										Undo
									</span>
								</button>
								{handleQuit && (
									<button
										type="button"
										onClick={handleQuit}
										className="glass-panel py-2 px-6 rounded-full flex items-center gap-3 border border-red-500/20 cursor-pointer hover:bg-red-500/10 transition-colors"
									>
										<span className="material-symbols-outlined text-sm text-red-400">exit_to_app</span>
										<span className="text-[10px] font-bold text-red-400 tracking-widest uppercase">
											Quit Tournament
										</span>
									</button>
								)}
							</div>
						</div>
					</div>

					{/* Right Card */}
					<Card
						interactive={true}
						className="flex flex-col items-center justify-between relative overflow-hidden group cursor-pointer h-full min-h-[400px] animate-float"
						style={{ animationDelay: '2s' }}
						variant="default"
						onClick={() =>
							currentMatch &&
							handleVoteWithAnimation(
								String(
									typeof currentMatch.right === "object"
										? currentMatch.right.id
										: currentMatch.right,
								),
								String(
									typeof currentMatch.left === "object" ? currentMatch.left.id : currentMatch.left,
								),
							)
						}
					>
						<div className="w-full aspect-square rounded-xl overflow-hidden mb-4 bg-white/10 flex items-center justify-center relative max-w-sm">
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
						<div className="text-center pb-4 z-10 w-full px-4">
							<h3 className="font-whimsical text-2xl text-white tracking-wide break-words w-full mb-2">
								{typeof currentMatch.right === "object"
									? currentMatch.right?.name
									: currentMatch.right}
							</h3>
							{typeof currentMatch.right === "object" && currentMatch.right?.description && (
								<p className="text-sm text-white/60 italic line-clamp-2">
									{currentMatch.right.description}
								</p>
							)}
						</div>
					</Card>
				</div>
			</main>

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
