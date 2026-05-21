import { X } from "lucide-react";
import { AnimatePresence, motion, type Transition } from "motion/react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { cn } from "@/shared/lib/utils";

const islandTransition: Transition = {
	type: "tween",
	ease: [0.22, 1, 0.36, 1],
	duration: 0.5,
};

function CircleProgress({ percentage }: { percentage: number }) {
	const size = 24;
	const strokeWidth = 2.5;
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const offset = circumference - (percentage / 100) * circumference;

	return (
		<svg width={size} height={size} className="-rotate-90 shrink-0" aria-hidden="true">
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				fill="none"
				stroke="var(--muted)"
				strokeWidth={strokeWidth}
			/>
			<motion.circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				fill="none"
				stroke="var(--foreground)"
				strokeWidth={strokeWidth}
				strokeDasharray={circumference}
				initial={{ strokeDashoffset: circumference }}
				animate={{ strokeDashoffset: offset }}
				transition={{ duration: 0.15, ease: "easeOut" }}
				strokeLinecap="round"
			/>
		</svg>
	);
}

export type DynamicIslandNavItem = {
	id: string;
	label: string;
	level?: number;
	icon?: ReactNode;
	isActive?: boolean;
	isAccent?: boolean;
	hasBadge?: boolean;
	ariaLabel?: string;
	ariaPressed?: boolean;
	onClick: () => void;
};

type DynamicIslandNavProps = {
	items: DynamicIslandNavItem[];
	/** Label shown in the collapsed pill */
	collapsedLabel: string;
	/** Key used to animate label changes in the collapsed pill */
	collapsedLabelKey?: string;
	progress?: number;
	isVisible?: boolean;
	prefersReducedMotion?: boolean;
	expandedTitle?: string;
};

export function DynamicIslandNav({
	items,
	collapsedLabel,
	collapsedLabelKey,
	progress = 0,
	isVisible = true,
	prefersReducedMotion = false,
	expandedTitle = "NAVIGATION",
}: DynamicIslandNavProps) {
	const [hoveredId, setHoveredId] = useState<string | null>(null);
	const [isExpanded, setIsExpanded] = useState(false);

	const minLevel = useMemo(() => {
		if (items.length === 0) {
			return 1;
		}
		return Math.min(...items.map((item) => item.level ?? 1));
	}, [items]);

	const expandedHeight = Math.min(420, Math.max(220, 72 + items.length * 44));

	useEffect(() => {
		if (!isExpanded) {
			return;
		}
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setIsExpanded(false);
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [isExpanded]);

	return (
		<>
			<AnimatePresence>
				{isExpanded && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={islandTransition}
						className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-[4px]"
						onClick={() => setIsExpanded(false)}
						aria-hidden="true"
					/>
				)}
			</AnimatePresence>

			<motion.nav
				aria-label="Primary"
				initial={prefersReducedMotion ? false : { y: 50, opacity: 0 }}
				animate={{
					y: isVisible ? 0 : 80,
					opacity: isVisible ? 1 : 0,
				}}
				transition={
					prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 25 }
				}
				className={cn(
					"fixed bottom-[max(1.25rem,var(--app-nav-bottom-offset,1.25rem))] left-1/2 z-[9999] flex -translate-x-1/2 flex-col items-center",
					!isVisible && "pointer-events-none",
				)}
			>
				<motion.div
					data-testid="dynamic-island-shell"
					onClick={() => {
						if (!isExpanded) {
							setIsExpanded(true);
						}
					}}
					initial={false}
					animate={{
						width: isExpanded ? 340 : 280,
						height: isExpanded ? expandedHeight : 52,
						borderRadius: isExpanded ? 24 : 26,
					}}
					transition={islandTransition}
					style={{ cursor: isExpanded ? "default" : "pointer" }}
					className="relative overflow-hidden border border-foreground/10 bg-background/95 text-foreground shadow-2xl backdrop-blur-md"
				>
					<motion.div
						initial={false}
						animate={{
							opacity: isExpanded ? 0 : 1,
							scale: isExpanded ? 0.95 : 1,
							filter: isExpanded ? "blur(4px)" : "blur(0px)",
						}}
						transition={{ ...islandTransition, delay: isExpanded ? 0 : 0.1 }}
						className={cn(
							"absolute inset-0 flex items-center gap-3 px-4 sm:px-5",
							isExpanded && "pointer-events-none",
						)}
					>
						<div className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />

						<div className="relative flex h-full flex-1 items-center overflow-hidden text-left">
							<AnimatePresence mode="popLayout" initial={false}>
								<motion.span
									data-testid="dynamic-island-collapsed-label"
									key={collapsedLabelKey ?? collapsedLabel}
									initial={prefersReducedMotion ? false : { opacity: 0, y: 15 }}
									animate={{ opacity: 1, y: 0 }}
									exit={prefersReducedMotion ? undefined : { opacity: 0, y: -15 }}
									transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
									className="block w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-foreground"
								>
									{collapsedLabel}
								</motion.span>
							</AnimatePresence>
						</div>

						<CircleProgress percentage={progress} />
					</motion.div>

					<motion.div
						initial={false}
						animate={{
							opacity: isExpanded ? 1 : 0,
							scale: isExpanded ? 1 : 1.05,
						}}
						transition={{ ...islandTransition, delay: isExpanded ? 0.1 : 0 }}
						className={cn("absolute inset-0 flex flex-col", !isExpanded && "pointer-events-none")}
					>
						<div className="flex shrink-0 items-center justify-between px-6 pb-3 pt-5">
							<span className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground">
								{expandedTitle}
							</span>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									setIsExpanded(false);
								}}
								className="text-muted-foreground transition-colors hover:text-foreground"
								aria-label="Close navigation menu"
							>
								<X className="h-5 w-5" />
							</button>
						</div>

						<div className="flex-1 overflow-y-auto overscroll-contain px-3 pb-4">
							<div className="flex flex-col gap-0.5">
								{items.map((item) => {
									const isActive = Boolean(item.isActive);
									const isHovered = hoveredId === item.id;
									const indentLevel = Math.max(0, (item.level ?? 1) - minLevel);
									const paddingLeft = indentLevel * 14 + 12;

									return (
										<button
											type="button"
											key={item.id}
											aria-label={item.ariaLabel ?? item.label}
											aria-current={isActive ? "location" : undefined}
											aria-pressed={
												typeof item.ariaPressed === "boolean" ? item.ariaPressed : undefined
											}
											onMouseEnter={() => setHoveredId(item.id)}
											onMouseLeave={() => setHoveredId(null)}
											onClick={(e) => {
												e.stopPropagation();
												item.onClick();
												setIsExpanded(false);
											}}
											style={{ paddingLeft: `${paddingLeft}px` }}
											className={cn(
												"group flex w-full shrink-0 cursor-pointer items-center gap-2 rounded-lg border-none py-2 pr-3 text-left text-sm transition-all duration-300 ease-out",
												item.isAccent && !isActive && "text-primary",
												item.isAccent && isActive && "bg-primary/15 font-medium text-primary",
												!item.isAccent &&
													isActive &&
													"bg-foreground/10 font-medium text-foreground",
												!isActive && isHovered && "bg-foreground/5 text-foreground/85",
												!isActive && !isHovered && "bg-transparent text-foreground/45",
											)}
										>
											{item.icon ? (
												<span className="relative flex shrink-0 items-center justify-center text-foreground/70">
													{item.icon}
													{item.hasBadge && (
														<span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
													)}
												</span>
											) : null}
											<span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap transition-transform duration-300 group-hover:translate-x-1">
												{item.label}
											</span>
											<motion.div
												initial={false}
												animate={{ scale: isActive ? 1 : 0, opacity: isActive ? 1 : 0 }}
												transition={{ duration: 0.3, ease: "easeOut" }}
												className="ml-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground"
											/>
										</button>
									);
								})}
							</div>
						</div>
					</motion.div>
				</motion.div>
			</motion.nav>
		</>
	);
}
