import type { KeyboardEvent } from "react";
import CatImage from "@/shared/components/layout/CatImage";
import {
	getFlameCount,
	getHeatCardClasses,
	getHeatGradientClasses,
	type HeatLevel,
	STREAK_THRESHOLDS,
} from "../utils/heat";

export interface MatchSideCardProps {
	side: "left" | "right";
	name: string;
	img: string | null;
	heatLevel: HeatLevel | null;
	streak: number;
	isVoting: boolean;
	isSelected: boolean;
	hasSelectionFeedback: boolean;
	isTeam: boolean;
	members: string[];
	description?: string;
	pronunciation?: string;
	onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
	onVote: () => void;
	animationDelay?: string;
}

function StreakFlames({
	count,
	side,
	name,
	streak,
	className = "animate-flame text-sm sm:text-base",
}: {
	count: number;
	side: string;
	name: string;
	streak: number;
	className?: string;
}) {
	return (
		<div className="flex gap-0.5">
			{Array.from({ length: count }).map((_, i) => (
				<span
					key={`${side}-flame-${name}-${streak}-${i}`}
					className={className}
					style={{ animationDelay: `${i * 60}ms` }}
				>
					🔥
				</span>
			))}
		</div>
	);
}

export function MatchSideCard({
	side,
	name,
	img,
	heatLevel,
	streak,
	isVoting,
	isSelected,
	hasSelectionFeedback,
	isTeam,
	members,
	description,
	pronunciation,
	onKeyDown,
	onVote,
	animationDelay,
}: MatchSideCardProps) {
	const isRight = side === "right";
	const textAlign = isRight ? "text-left sm:text-right" : "text-left";
	const bodyAlignment = isRight ? "items-start sm:items-end" : "items-start";
	const selectionClass = isSelected
		? "ring-2 ring-emerald-400/70 shadow-[0_0_45px_rgba(16,185,129,0.28)]"
		: hasSelectionFeedback
			? "scale-[0.985] opacity-60"
			: "";

	const showStreak = streak >= STREAK_THRESHOLDS.warm;
	const streakBadgeCount = Math.min(getFlameCount(streak), 4);

	return (
		<div className="flex min-h-[18rem] flex-1 flex-col sm:min-h-[26rem]">
			<div
				className={`group relative flex-1 overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/30 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
					isVoting ? "pointer-events-none" : "cursor-pointer"
				} ${getHeatCardClasses(heatLevel)} ${selectionClass}`}
				style={animationDelay ? { animationDelay } : undefined}
				role="button"
				tabIndex={isVoting ? -1 : 0}
				aria-label={`Vote for ${isTeam ? "team" : "name"} ${name}`}
				aria-disabled={isVoting}
				onKeyDown={onKeyDown}
				onClick={onVote}
			>
				<div className="relative flex h-full w-full items-center justify-center bg-foreground/10">
					{img ? (
						<CatImage
							src={img}
							alt={name}
							objectFit="cover"
							containerClassName="h-full w-full"
							imageClassName="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
						/>
					) : (
						<span className="select-none text-6xl font-bold text-foreground/20">
							{name[0]?.toUpperCase() || "?"}
						</span>
					)}

					{heatLevel && (
						<div className="pointer-events-none absolute inset-0 z-10">
							<div className={`absolute inset-0 ${getHeatGradientClasses(heatLevel)}`} />
						</div>
					)}

					{showStreak && (
						<div
							className={`absolute top-4 z-20 ${
								isRight ? "right-4" : "left-4"
							} inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 backdrop-blur-md`}
						>
							<StreakFlames
								count={streakBadgeCount}
								side={side}
								name={name}
								streak={streak}
								className="animate-flame text-xs"
							/>
							<span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75">
								{streak} straight
							</span>
						</div>
					)}

					<div
						className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col gap-2 bg-gradient-to-t from-slate-950/96 via-slate-950/60 to-transparent p-5 sm:p-6 ${bodyAlignment} ${textAlign}`}
					>
						<p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/45">
							{isTeam ? "Team" : "Name"}
						</p>
						<h3
							className={`max-w-[18rem] break-words font-display text-3xl leading-[0.92] text-white sm:text-4xl ${textAlign}`}
						>
							{name}
						</h3>
						{pronunciation && (
							<span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/65">
								[{pronunciation}]
							</span>
						)}
						{isTeam ? (
							<div
								className={`mt-1 flex flex-wrap gap-1.5 ${isRight ? "justify-start sm:justify-end" : "justify-start"}`}
							>
								{members.map((member) => (
									<span
										key={`${side}-member-${member}`}
										className="rounded-full border border-white/12 bg-white/[0.08] px-2.5 py-1 text-[11px] font-medium text-white/80"
									>
										{member}
									</span>
								))}
							</div>
						) : description ? (
							<p
								className={`mt-1 max-w-[22rem] text-sm leading-relaxed text-white/72 ${textAlign}`}
							>
								{description}
							</p>
						) : null}
					</div>
				</div>
			</div>
		</div>
	);
}
