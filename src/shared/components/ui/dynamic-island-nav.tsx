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
					"fixed bottom-2 sm:bottom-6 left-1/2 z-[9999] flex -translate-x-1/2 flex-col items-center w-[calc(100%-1rem)] sm:w-auto",
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
						width: isExpanded ? "100%" : "100%",
						maxWidth: isExpanded ? 360 : 300,
						height: isExpanded ? expandedHeight : 60,
						borderRadius: isExpanded ? 32 : 30,
					}}
					transition={islandTransition}
					style={{ cursor: isExpanded ? "default" : "pointer" }}
					className="relative overflow-hidden border border-foreground/10 dark:border-white/10 bg-background/85 text-foreground shadow-[0_24px_50px_-12px_rgba(0,0,0,0.3)] backdrop-blur-xl"
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
						<div
							className="h-2 w-2 shrink-0 rounded-full bg-primary animate-pulse"
							aria-hidden="true"
						/>

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
						<div className="flex shrink-0 items-center justify-between px-7 pb-3 pt-7">
							<span className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground/60">
								{expandedTitle}
							</span>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									setIsExpanded(false);
								}}
								className="flex h-6.5 w-6.5 items-center justify-center rounded-full text-muted-foreground/70 hover:bg-foreground/5 dark:hover:bg-white/5 hover:text-foreground active:scale-90 transition-all duration-200"
								aria-label="Close navigation menu"
							>
								<X className="h-4.5 w-4.5" />
							</button>
						</div>

						<div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-5">
							<div className="flex flex-col gap-1">
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
												"group flex w-full shrink-0 cursor-pointer items-center gap-2.5 rounded-xl border-none py-2.5 pr-3 text-left text-sm transition-[transform,background-color,color] active:scale-[0.96] duration-200 ease-out relative",
												item.isAccent && !isActive && "text-primary",
												item.isAccent && isActive && "bg-primary/15 font-semibold text-primary",
												!item.isAccent &&
													isActive &&
													"bg-foreground/10 font-semibold text-foreground",
												!isActive && isHovered && "bg-foreground/5 text-foreground/90",
												!isActive && !isHovered && "bg-transparent text-foreground/50",
												indentLevel > 0 && "opacity-90",
											)}
										>
											{indentLevel > 0 && (
												<svg
													className="absolute top-0 h-[18px] w-[14px] text-foreground/20 dark:text-white/20 stroke-current fill-none pointer-events-none select-none"
													style={{ left: `${(indentLevel - 1) * 14 + 20}px` }}
													viewBox="0 0 14 18"
													strokeWidth="1.5"
													strokeLinecap="round"
													aria-hidden="true"
												>
													<path d="M 1,0 L 1,9 Q 1,13 12,13" />
												</svg>
											)}
											{item.icon ? (
												<span className="relative flex shrink-0 items-center justify-center text-foreground/75 transition-colors duration-200 group-hover:text-foreground">
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
												transition={{ duration: 0.25, ease: "easeOut" }}
												className={cn(
													"ml-1 h-1.5 w-1.5 shrink-0 rounded-full",
													item.isAccent
														? "bg-primary shadow-[0_0_6px_var(--primary)]"
														: "bg-foreground",
												)}
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
