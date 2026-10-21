import { type KeyboardEvent, memo } from "react";
import { CatImage } from "@/components/LayoutBlocks";
import {
	getFlameCount,
	getHeatCardClasses,
	getHeatGradientClasses,
	type HeatLevel,
	STREAK_THRESHOLDS,
} from "@/tournament/tournamentEngine";

interface MatchSideCardProps {
	side: "left" | "right";
	name: string;
	img: string | null;
	heatLevel: HeatLevel | null;
	streak: number;
	rating: number;
	winOdds?: number;
	isFavored: boolean;
	isVoting: boolean;
	isSelected: boolean;
	hasSelectionFeedback: boolean;
	isTeam: boolean;
	members: string[];
	description?: string;
	pronunciation?: string;
	onVote: () => void;
	onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void;
	shortcutHint?: string;
	animationDelay?: string;
}

/**
 * Animated ember markers showing active win-streak intensity.
 */
function StreakEmbers({
	count,
	side,
	name,
	streak,
}: {
	count: number;
	side: string;
	name: string;
	streak: number;
}) {
	return (
		<div className="flex items-center gap-1" aria-hidden="true">
			{Array.from({ length: count }).map((_, i) => (
				<span
					key={`${side}-flame-${name}-${streak}-${i}`}
					className="h-1.5 w-3.5 rounded-full bg-accent/90 shadow-[0_0_8px_hsl(var(--pw-coral-hsl)/0.6)] sm:w-4"
					style={{ animationDelay: `${i * 60}ms` }}
				/>
			))}
		</div>
	);
}

/**
 * Top floating badges for streak momentum and Elo rating.
 */
function ContenderBadges({
	side,
	name,
	streak,
	rating,
	winOdds,
	isFavored,
	isRight,
}: {
	side: "left" | "right";
	name: string;
	streak: number;
	rating: number;
	winOdds?: number;
	isFavored: boolean;
	isRight: boolean;
}) {
	const showStreak = streak >= STREAK_THRESHOLDS.warm;
	const streakBadgeCount = Math.min(getFlameCount(streak), 4);
	const ratingSideClass = isRight ? "left-3 sm:left-4" : "right-3 sm:right-4";
	const streakSideClass = isRight ? "right-3 sm:right-4" : "left-3 sm:left-4";

	return (
		<>
			{showStreak && (
				<div
					className={`absolute top-3 sm:top-4 z-20 ${streakSideClass} inline-flex items-center gap-2 rounded-full border border-white/30 dark:border-white/15 bg-white/40 dark:bg-black/40 px-2.5 py-1 sm:px-3 sm:py-1.5 shadow-sm backdrop-blur-md transition-transform`}
				>
					<StreakEmbers count={streakBadgeCount} side={side} name={name} streak={streak} />
					<span className="text-[10px] font-bold tracking-wide text-foreground/90">
						{streak} in a row
					</span>
				</div>
			)}

			<div
				className={`absolute top-3 sm:top-4 z-20 inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-white/30 dark:border-white/15 bg-white/40 dark:bg-black/40 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[10px] font-semibold tracking-wide text-foreground/80 shadow-sm backdrop-blur-md ${ratingSideClass}`}
			>
				<span className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
				<span className="font-mono tabular-nums">{Math.round(rating)}</span>
				{winOdds !== undefined && (
					<>
						<span className="h-1 w-1 rounded-full bg-foreground/30" />
						<span className="font-mono text-muted-foreground tabular-nums">
							{Math.round(winOdds * 100)}%
						</span>
					</>
				)}
				{isFavored && (
					<>
						<span className="h-1.5 w-1.5 rounded-full bg-primary" />
						<span className="font-bold text-primary">Favored</span>
					</>
				)}
			</div>
		</>
	);
}

/**
 * Bottom overlay containing contender title, backstory, pronunciation, and team roster.
 */
function ContenderFooter({
	name,
	isTeam,
	members,
	description,
	pronunciation,
	shortcutHint,
	textAlign,
	bodyAlignment,
	isRight,
	side,
}: {
	name: string;
	isTeam: boolean;
	members: string[];
	description?: string;
	pronunciation?: string;
	shortcutHint?: string;
	textAlign: string;
	bodyAlignment: string;
	isRight: boolean;
	side: string;
}) {
	return (
		<div
			className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col gap-1.5 bg-gradient-to-t from-background/98 via-background/80 to-transparent p-4 sm:p-5 lg:p-6 backdrop-blur-[2px] ${bodyAlignment} ${textAlign}`}
		>
			<div className="flex items-center gap-2">
				<span className="text-[10px] font-bold tracking-wide text-muted-foreground">
					{isTeam ? "Team Contender" : "Cat Contender"}
				</span>
				{shortcutHint && (
					<span className="inline-flex items-center rounded-md border border-border/60 bg-muted/60 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wide text-muted-foreground shadow-sm">
						{shortcutHint}
					</span>
				)}
			</div>

			<h3
				id={`contender-name-${side}`}
				className={`w-full break-words font-display text-2xl font-bold leading-tight text-foreground transition-colors group-hover:text-primary sm:text-3xl lg:text-4xl ${textAlign}`}
			>
				{name}
			</h3>

			{pronunciation && (
				<span className="font-sans text-[11px] font-medium tracking-wide text-muted-foreground">
					/{pronunciation}/
				</span>
			)}

			{isTeam ? (
				<div
					className={`mt-1 flex flex-wrap gap-1.5 ${
						isRight ? "justify-start sm:justify-end" : "justify-start"
					}`}
				>
					{members.map((member) => (
						<span
							key={`${side}-member-${member}`}
							className="rounded-full border border-border/50 bg-secondary/60 px-2.5 py-0.5 text-[11px] font-medium text-secondary-foreground shadow-sm"
						>
							{member}
						</span>
					))}
				</div>
			) : description ? (
				<p
					className={`mt-1 max-w-full sm:max-w-[28rem] line-clamp-3 text-xs leading-relaxed text-muted-foreground sm:text-sm ${textAlign}`}
				>
					{description}
				</p>
			) : null}
		</div>
	);
}

/**
 * Nature-inspired tactile battle card for tournament matchups.
 */
export const MatchSideCard = memo(function MatchSideCard({
	side,
	name,
	img,
	heatLevel,
	streak,
	rating,
	winOdds,
	isFavored,
	isVoting,
	isSelected,
	hasSelectionFeedback,
	isTeam,
	members,
	description,
	pronunciation,
	onVote,
	onKeyDown,
	shortcutHint,
	animationDelay,
}: MatchSideCardProps) {
	const isRight = side === "right";
	const textAlign = isRight ? "text-left sm:text-right" : "text-left";
	const bodyAlignment = isRight ? "items-start sm:items-end" : "items-start";

	const selectionClass = isSelected
		? "ring-2 ring-primary shadow-[0_0_40px_hsl(var(--pw-sage-hsl)/0.35)] scale-[1.01]"
		: hasSelectionFeedback
			? "scale-[0.985] opacity-50 blur-[0.5px]"
			: "";

	return (
		<div className="flex min-h-[22rem] flex-1 flex-col sm:min-h-[26rem] lg:min-h-[30rem]">
			<button
				type="button"
				id={`match-card-${side}`}
				className={`group relative flex h-full flex-1 overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border border-border/50 hover:border-primary/40 bg-card/90 dark:bg-card/75 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.08)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.35)] transition-all duration-[300ms] ease-spring focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background active:scale-[0.93] hover:shadow-2xl hover:-translate-y-2 ${
					isVoting ? "pointer-events-none" : "cursor-pointer"
				} ${getHeatCardClasses(heatLevel)} ${selectionClass}`}
				style={animationDelay ? { animationDelay } : undefined}
				aria-label={`Vote for ${isTeam ? "team" : "name"} ${name}`}
				aria-keyshortcuts={side === "left" ? "ArrowLeft ArrowUp 1 a" : "ArrowRight ArrowDown 2 d"}
				aria-disabled={isVoting}
				onClick={onVote}
				onKeyDown={onKeyDown}
			>
				<div className="relative flex h-full w-full items-center justify-center bg-muted/30">
					{img ? (
						<CatImage
							src={img}
							alt={name}
							containerClassName="h-full w-full"
							imageClassName="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-card/80 via-card/40 to-muted/30">
							<span className="select-none font-display text-7xl font-extrabold text-muted-foreground sm:text-8xl">
								{name[0]?.toUpperCase() || "?"}
							</span>
						</div>
					)}

					{heatLevel && (
						<div className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
							<div className={`absolute inset-0 ${getHeatGradientClasses(heatLevel)}`} />
						</div>
					)}

					<ContenderBadges
						side={side}
						name={name}
						streak={streak}
						rating={rating}
						winOdds={winOdds}
						isFavored={isFavored}
						isRight={isRight}
					/>

					<ContenderFooter
						name={name}
						isTeam={isTeam}
						members={members}
						description={description}
						pronunciation={pronunciation}
						shortcutHint={shortcutHint}
						textAlign={textAlign}
						bodyAlignment={bodyAlignment}
						isRight={isRight}
						side={side}
					/>
				</div>
			</button>
		</div>
	);
});
