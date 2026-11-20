import { motion } from "framer-motion";
import { Flame, Sparkles } from "lucide-react";
import { memo } from "react";
import { NameOrb } from "@/components/GlassEffects";
import { MOTION_DURATIONS } from "@/lib/utils";
import {
	getHeatCardClasses,
	getHeatGradientClasses,
	type HeatLevel,
	STREAK_THRESHOLDS,
} from "@/tournament/tournamentEngine";

export interface OrbMemberInfo {
	id: string;
	name: string;
	description?: string;
	pronunciation?: string;
}

export interface MatchSideCardProps {
	side: "left" | "right";
	name: string;
	orbMembers: OrbMemberInfo[];
	heatLevel: HeatLevel | null;
	streak: number;
	rating: number;
	isVoting: boolean;
	isSelected: boolean;
	hasSelectionFeedback: boolean;
	isTeam: boolean;
	description?: string;
	pronunciation?: string;
	onVote: () => void;
}

export const MatchSideCard = memo(function MatchSideCard({
	side,
	name,
	orbMembers,
	heatLevel,
	streak,
	rating,
	isVoting,
	isSelected,
	hasSelectionFeedback,
	isTeam,
	description,
	pronunciation,
	onVote,
}: MatchSideCardProps) {
	const isRight = side === "right";
	return (
		<motion.div
			className="relative flex-1 flex flex-col w-full h-full"
			initial={{ opacity: 0, y: isRight ? 12 : -12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: MOTION_DURATIONS.base }}
		>
			<button
				type="button"
				onClick={onVote}
				disabled={isVoting}
				className={`group relative flex-1 flex flex-col items-center justify-between p-5 sm:p-6 rounded-3xl border transition-all duration-200 w-full overflow-hidden text-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary ${
					isSelected && hasSelectionFeedback
						? "border-primary ring-4 ring-primary/40 scale-[1.01] shadow-xl bg-card"
						: "border-border/60 hover:border-primary/60 bg-card/90 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
				} ${getHeatCardClasses(heatLevel)}`}
				aria-label={`Vote for ${name}`}
			>
				{heatLevel && (
					<div
						className={`absolute inset-0 pointer-events-none opacity-35 ${getHeatGradientClasses(heatLevel)}`}
					/>
				)}
				<div className="relative z-10 w-full flex items-center justify-between text-xs text-muted-foreground font-mono tabular-nums">
					<span className="inline-flex items-center gap-1.5">
						<span>ELO {Math.round(rating)}</span>
						{isTeam && (
							<span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-sans text-[10px] font-bold text-primary">
								Duo Group
							</span>
						)}
					</span>
					{streak >= STREAK_THRESHOLDS.warm && (
						<span className="flex items-center gap-1 text-orange-400 font-bold">
							<Flame className="size-3.5 fill-orange-400" />
							{streak} streak
						</span>
					)}
				</div>

				<div className="relative z-10 my-5 flex flex-col items-center gap-4 w-full">
					{orbMembers.length > 1 ? (
						<div className="relative flex items-center justify-center -space-x-3 sm:-space-x-2 py-1 group-hover:scale-[1.03] transition-transform duration-200">
							{orbMembers.map((member, idx) => (
								<div
									key={`${member.id}-${idx}`}
									className={`relative transition-transform duration-200 ${
										idx === 0
											? "-rotate-3 group-hover:-translate-x-1"
											: "rotate-3 group-hover:translate-x-1"
									}`}
								>
									<NameOrb
										orbId={`${side}-${member.id}-${idx}`}
										name={member.name}
										orbitText={
											member.description ||
											(member.pronunciation ? `/${member.pronunciation}/` : "")
										}
										size={136}
									/>
								</div>
							))}
							<div className="absolute z-20 flex size-8 items-center justify-center rounded-full border border-primary/40 bg-card text-primary shadow-md font-display font-black text-sm">
								+
							</div>
						</div>
					) : (
						<div className="relative py-1 group-hover:scale-105 transition-transform duration-200">
							<NameOrb
								orbId={`${side}-${orbMembers[0]?.id ?? name}`}
								name={orbMembers[0]?.name ?? name}
								orbitText={
									orbMembers[0]?.description ||
									description ||
									(pronunciation ? `/${pronunciation}/` : "")
								}
								size={162}
							/>
						</div>
					)}

					<div className="space-y-1.5 max-w-sm">
						<h3 className="font-display font-black text-2xl sm:text-3xl text-foreground tracking-tight group-hover:text-primary transition-colors">
							{name}
						</h3>
						{pronunciation && !isTeam && (
							<p className="text-xs text-muted-foreground/80 font-mono">/{pronunciation}/</p>
						)}
						{isTeam && orbMembers.length > 1 ? (
							<div className="flex flex-col gap-1 pt-1">
								{orbMembers.map((member) =>
									member.description ? (
										<p
											key={member.id}
											className="text-xs text-muted-foreground line-clamp-1 leading-relaxed"
										>
											<span className="font-bold text-foreground/90">{member.name}:</span>{" "}
											{member.description}
										</p>
									) : null,
								)}
							</div>
						) : (
							description && (
								<p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto line-clamp-2">
									{description}
								</p>
							)
						)}
					</div>
				</div>

				<div className="relative z-10 w-full pt-2">
					<div className="w-full py-2.5 rounded-2xl bg-primary/15 border border-primary/30 text-primary font-bold text-sm tracking-wide group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200 flex items-center justify-center gap-1.5">
						<Sparkles className="size-3.5" />
						<span>Vote {isRight ? "Right" : "Left"}</span>
					</div>
				</div>
			</button>
		</motion.div>
	);
});
