import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import {
	type CSSProperties,
	memo,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { DriftWallTile } from "@/components/GlassEffects";

export interface DriftWallItem {
	image?: string;
	title?: string;
	name?: string;
	subtitle?: string;
	orbitText?: string;
	href?: string;
	id?: string | number;
	selected?: boolean;
	locked?: boolean;
	duelSide?: "left" | "right" | null;
	duelPartnerIndex?: number;
	isChampion?: boolean;
	isQueuedSurvivor?: boolean;
	isJustVotedWinner?: boolean;
	brightness?: number;
	opacity?: number;
	blur?: number;
	borderWidth?: number;
	borderRadius?: number;
	onClick?: () => void;
	[key: string]: unknown;
}

export interface DriftWallTournamentStage {
	active: boolean;
	isComplete: boolean;
	round: number;
	totalRounds: number;
	bracketStage: string;
	matchNumber: number;
	totalMatches: number;
	progress: number;
	tournamentMode: "1v1" | "2v2";
	leftLabel?: string;
	rightLabel?: string;
	leftSub?: string;
	rightSub?: string;
	leftElo?: number;
	rightElo?: number;
	leftStreak?: number;
	rightStreak?: number;
	championLabel?: string;
	championSub?: string;
	championElo?: number;
	votingSide?: "left" | "right" | null;
	isVoting?: boolean;
	queuedCount?: number;
	onVoteSide?: (side: "left" | "right") => void;
}

export interface DriftWallProps {
	items?: DriftWallItem[];
	columns?: number;
	tileWidth?: number;
	tileHeight?: number;
	gap?: number;
	radius?: number | string;
	tilt?: number;
	turn?: number;
	roll?: number;
	perspective?: number;
	depth?: number;
	speed?: number;
	direction?: "up" | "down";
	variance?: number;
	parallax?: number;
	pauseOnHover?: boolean;
	lift?: number;
	fade?: number;
	dim?: number;
	grayscale?: boolean;
	overlayColor?: string;
	brightness?: number;
	opacity?: number;
	blur?: number;
	borderWidth?: number;
	className?: string;
	style?: CSSProperties;
	dockFooter?: React.ReactNode;
	tournamentStage?: DriftWallTournamentStage | null;
	onItemClick?: (item: DriftWallItem, index: number) => void;
	onItemsBatchSelect?: (items: DriftWallItem[]) => void;
	[key: string]: unknown;
}

interface BodyState {
	x: number;
	y: number;
	vx: number;
	vy: number;
	scale: number;
	phase: number;
	wasSelected: boolean;
}

interface MarqueeBoxState {
	left: number;
	top: number;
	width: number;
	height: number;
	targetedCount: number;
}

export const DriftWall = memo(function DriftWall({
	items = [],
	tileWidth = 132,
	gap = 14,
	radius = 9999,
	speed = 38,
	pauseOnHover = true,
	dim = 1,
	grayscale = false,
	overlayColor = "#060010",
	brightness = 60,
	opacity = 0.85,
	blur = 11,
	borderWidth = 0.16,
	className = "",
	style,
	dockFooter,
	tournamentStage = null,
	onItemClick,
	onItemsBatchSelect,
}: DriftWallProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
	const rafRef = useRef<number | null>(null);
	const lastTsRef = useRef<number | null>(null);

	const pointerRef = useRef<{
		x: number;
		y: number;
		prevX: number;
		prevY: number;
		angleDeg: number;
		tailPhase: number;
		active: boolean;
		inFooter: boolean;
		pressing: boolean;
	}>({
		x: 0,
		y: 0,
		prevX: 0,
		prevY: 0,
		angleDeg: -45,
		tailPhase: 0,
		active: false,
		inFooter: false,
		pressing: false,
	});
	const mouseCursorRef = useRef<HTMLDivElement>(null);
	const mouseTailPathRef = useRef<SVGPathElement>(null);

	const hoveredIndexRef = useRef<number>(-1);
	const activeTileElRef = useRef<HTMLElement | null>(null);

	// Windows-desktop-style marquee drag state
	const dragRef = useRef<{
		active: boolean;
		isMarquee: boolean;
		pointerId: number | null;
		startX: number;
		startY: number;
		currX: number;
		currY: number;
		suppressClickUntil: number;
	}>({
		active: false,
		isMarquee: false,
		pointerId: null,
		startX: 0,
		startY: 0,
		currX: 0,
		currY: 0,
		suppressClickUntil: 0,
	});
	const targetedIndicesRef = useRef<Set<number>>(new Set());
	const [marqueeBox, setMarqueeBox] = useState<MarqueeBoxState | null>(null);

	const [dims, setDims] = useState({ w: 1280, h: 760 });
	const [reduced, setReduced] = useState(false);

	useEffect(() => {
		if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
			const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
			setReduced(mq.matches);
			const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
			mq.addEventListener?.("change", onChange);
			return () => mq.removeEventListener?.("change", onChange);
		}
	}, []);

	useLayoutEffect(() => {
		if (!containerRef.current || typeof ResizeObserver === "undefined") {
			return;
		}
		const rect = containerRef.current.getBoundingClientRect();
		if (rect.width > 0 && rect.height > 0) {
			setDims({ w: Math.round(rect.width), h: Math.round(rect.height) });
		}
		const ro = new ResizeObserver(([entry]) => {
			if (entry?.contentRect) {
				const nextW = Math.round(entry.contentRect.width) || 1280;
				const nextH = Math.round(entry.contentRect.height) || 760;
				setDims((prev) => (prev.w === nextW && prev.h === nextH ? prev : { w: nextW, h: nextH }));
			}
		});
		ro.observe(containerRef.current);
		return () => ro.disconnect();
	}, []);

	const isMobile = dims.w > 0 && dims.w < 640;
	const effSize = useMemo(() => {
		if (isMobile) {
			return Math.min(tileWidth, 92);
		}
		if (dims.w < 1024) {
			return Math.min(tileWidth, 112);
		}
		return Math.min(tileWidth, 126);
	}, [isMobile, dims.w, tileWidth]);

	// Strictly deduplicate items by name and cap to a comfortable floating density
	const uniqueEntries = useMemo(() => {
		const seen = new Set<string>();
		const result: { item: DriftWallItem; originalIndex: number }[] = [];
		for (let idx = 0; idx < items.length; idx++) {
			const item = items[idx];
			if (!item) {
				continue;
			}
			const key = String(item.title || item.name || item.id || idx)
				.trim()
				.toLowerCase();
			if (seen.has(key)) {
				continue;
			}
			seen.add(key);
			result.push({ item, originalIndex: idx });
		}
		const maxFloating = isMobile ? 18 : 32;
		if (result.length <= maxFloating) {
			return result;
		}
		const selected = result.filter((r) => r.item.selected);
		const unselected = result.filter((r) => !r.item.selected);
		return [...selected, ...unselected].slice(0, maxFloating);
	}, [items, isMobile]);

	// Compute the Unified Morphing Sanctuary Dock / Arena Stage geometry at the bottom center
	const sanctuaryRect = useMemo(() => {
		const selectedCount = uniqueEntries.filter((e) => e.item.selected).length;
		const bottomMargin = isMobile ? 12 : 20;
		const footerHeight = dockFooter ? (isMobile ? 54 : 58) : 0;
		const maxDockW = Math.max(280, Math.min(dims.w - (isMobile ? 16 : 48), 1120));
		const orbSlotPitch = effSize + (isMobile ? 10 : 16);
		const maxPerRow = Math.max(2, Math.floor((maxDockW - 48) / orbSlotPitch));

		// Tournament Arena Stage Mode: Sanctuary Dock expands into the head-to-head stage
		if (tournamentStage?.active) {
			const stageW = Math.min(
				maxDockW,
				Math.max(isMobile ? dims.w - 16 : 680, Math.round(dims.w * 0.8)),
			);
			const hasQueue = (tournamentStage.queuedCount ?? 0) > 0 && !tournamentStage.isComplete;
			const desiredChamberH = tournamentStage.isComplete
				? isMobile
					? 268
					: 298
				: hasQueue
					? isMobile
						? 324
						: 368
					: isMobile
						? 268
						: 304;
			const maxChamberH = Math.max(230, Math.round(dims.h * 0.56));
			const chamberHeight = Math.min(maxChamberH, desiredChamberH);
			const height = chamberHeight + footerHeight;
			const bottom = dims.h - bottomMargin;
			const top = Math.max(isMobile ? 72 : 88, bottom - height);
			const left = Math.round((dims.w - stageW) * 0.5);

			return {
				left,
				right: left + stageW,
				top,
				bottom,
				width: stageW,
				height: bottom - top,
				chamberHeight: bottom - top - footerHeight,
				footerHeight,
				selectedCount: Math.max(1, selectedCount),
				maxPerRow,
				rows: hasQueue ? 2 : 1,
				borderRadius: 36,
			};
		}

		if (selectedCount === 0) {
			const compactW = Math.min(maxDockW, isMobile ? dims.w - 20 : 640);
			const height = Math.max(48, footerHeight);
			const bottom = dims.h - bottomMargin;
			const top = bottom - height;
			const left = Math.round((dims.w - compactW) * 0.5);
			return {
				left,
				right: left + compactW,
				top,
				bottom,
				width: compactW,
				height,
				chamberHeight: 0,
				footerHeight,
				selectedCount: 0,
				maxPerRow,
				rows: 0,
				borderRadius: 9999,
			};
		}

		const rows = selectedCount > maxPerRow ? 2 : 1;
		const colsInWidestRow =
			rows > 1 ? Math.min(maxPerRow, Math.ceil(selectedCount / 2)) : selectedCount;
		const minExpandedW = Math.min(maxDockW, isMobile ? dims.w - 20 : 620);
		const hugWidth = colsInWidestRow * orbSlotPitch + (isMobile ? 44 : 76);
		const width = Math.min(maxDockW, Math.max(minExpandedW, hugWidth));

		const headerH = 28;
		const chamberHeight =
			rows === 2
				? Math.min(
						Math.round(dims.h * 0.42),
						headerH + Math.round(effSize * 1.88) + (isMobile ? 22 : 32),
					)
				: headerH + effSize + (isMobile ? 18 : 26);

		const height = chamberHeight + footerHeight;
		const bottom = dims.h - bottomMargin;
		const top = Math.max(96, bottom - height);
		const left = Math.round((dims.w - width) * 0.5);

		return {
			left,
			right: left + width,
			top,
			bottom,
			width,
			height: bottom - top,
			chamberHeight: bottom - top - footerHeight,
			footerHeight,
			selectedCount,
			maxPerRow,
			rows,
			borderRadius: 32,
		};
	}, [uniqueEntries, dims.w, dims.h, effSize, isMobile, dockFooter, tournamentStage]);

	// Track forcefield ripple trigger whenever an orb is captured, eliminated, or match progresses
	const prevSelectedCountRef = useRef(sanctuaryRect.selectedCount);
	const prevMatchNumRef = useRef(tournamentStage?.matchNumber ?? 0);
	const [rippleKey, setRippleKey] = useState(0);
	useEffect(() => {
		const matchNum = tournamentStage?.matchNumber ?? 0;
		if (
			sanctuaryRect.selectedCount !== prevSelectedCountRef.current ||
			matchNum !== prevMatchNumRef.current
		) {
			if (sanctuaryRect.selectedCount > 0 || tournamentStage?.active) {
				setRippleKey((k) => k + 1);
			}
			prevSelectedCountRef.current = sanctuaryRect.selectedCount;
			prevMatchNumRef.current = matchNum;
		}
	}, [sanctuaryRect.selectedCount, tournamentStage?.matchNumber, tournamentStage?.active]);

	const bodiesRef = useRef<BodyState[]>([]);
	const uniqueEntriesRef = useRef(uniqueEntries);
	useEffect(() => {
		uniqueEntriesRef.current = uniqueEntries;
	}, [uniqueEntries]);

	const sanctuaryRectRef = useRef(sanctuaryRect);
	useEffect(() => {
		sanctuaryRectRef.current = sanctuaryRect;
	}, [sanctuaryRect]);

	const tournamentStageRef = useRef(tournamentStage);
	useEffect(() => {
		tournamentStageRef.current = tournamentStage;
	}, [tournamentStage]);

	// Initialize or resize physical bodies without resetting existing positions unnecessarily
	useEffect(() => {
		const entries = uniqueEntries;
		const count = entries.length;
		const sRect = sanctuaryRectRef.current;
		const r = effSize / 2;
		const pad = 12;
		const minX = r + pad;
		const maxX = Math.max(minX + 10, dims.w - r - pad);
		const minY = r + pad;
		const upperMaxY = Math.max(minY + 40, sRect.top - r - 12);
		const usableW = Math.max(100, maxX - minX);
		const usableH = Math.max(100, upperMaxY - minY);

		const cols = Math.max(2, Math.ceil(Math.sqrt((count * usableW) / usableH)));
		const rows = Math.max(2, Math.ceil(count / cols));
		const cellW = usableW / cols;
		const cellH = usableH / rows;

		const nextBodies: BodyState[] = [];
		for (let i = 0; i < count; i++) {
			const isSel = Boolean(entries[i]?.item.selected);
			const existing = bodiesRef.current[i];
			if (existing) {
				// If an orb just transitioned from selected -> unselected (e.g., eliminated in a duel!), launch it upward out of the Sanctuary forcefield
				const justEliminated = existing.wasSelected && !isSel;
				const launchedVy = justEliminated ? -Math.max(speed * 4.8, 280) : existing.vy;
				const horizDir = existing.x < dims.w * 0.5 ? -1 : 1;
				const launchedVx = justEliminated
					? horizDir * Math.max(speed * 2.2, 95) + ((i % 3) - 1) * 35
					: existing.vx;
				nextBodies.push({
					...existing,
					x: Math.min(maxX, Math.max(minX, existing.x)),
					y: Math.min(dims.h - r - pad, Math.max(minY, existing.y)),
					vx: launchedVx,
					vy: launchedVy,
					wasSelected: isSel,
				});
				continue;
			}
			const col = i % cols;
			const row = Math.floor(i / cols);
			const jitterX = (((i * 0.6180339887) % 1) - 0.5) * cellW * 0.45;
			const jitterY = (((i * 0.3819660113) % 1) - 0.5) * cellH * 0.45;
			const x = Math.min(maxX, Math.max(minX, minX + (col + 0.5) * cellW + jitterX));
			const y = isSel
				? sRect.top + sRect.chamberHeight * 0.55
				: Math.min(upperMaxY, Math.max(minY, minY + (row + 0.5) * cellH + jitterY));
			const angle = i * 2.399963229728653;
			const baseSpeed = speed * (0.65 + ((i * 0.31) % 0.7));
			nextBodies.push({
				x,
				y,
				vx: Math.cos(angle) * baseSpeed,
				vy: Math.sin(angle) * baseSpeed,
				scale: 1,
				phase: (i * 1.17) % (Math.PI * 2),
				wasSelected: isSel,
			});
		}
		bodiesRef.current = nextBodies;
	}, [uniqueEntries, dims.w, dims.h, effSize, speed]);

	const clearTargetedOrbs = useCallback(() => {
		if (targetedIndicesRef.current.size > 0) {
			for (const idx of targetedIndicesRef.current) {
				const wrapper = nodeRefs.current[idx];
				const tile = wrapper?.querySelector(".drift-wall__tile");
				tile?.classList.remove("is-targeted");
			}
			targetedIndicesRef.current.clear();
		}
	}, []);

	const syncMarqueeTargets = useCallback(
		(left: number, top: number, right: number, bottom: number) => {
			const bodies = bodiesRef.current;
			const entries = uniqueEntriesRef.current;
			const hitPad = effSize * 0.32;
			const nextSet = new Set<number>();

			for (let i = 0; i < bodies.length; i++) {
				const entry = entries[i];
				const b = bodies[i];
				if (!entry || !b || entry.item.selected || entry.item.locked) {
					continue;
				}
				const inside =
					b.x + hitPad >= left &&
					b.x - hitPad <= right &&
					b.y + hitPad >= top &&
					b.y - hitPad <= bottom;
				const wrapper = nodeRefs.current[i];
				const tile = wrapper?.querySelector(".drift-wall__tile");
				if (inside) {
					nextSet.add(i);
					tile?.classList.add("is-targeted");
				} else {
					tile?.classList.remove("is-targeted");
				}
			}

			targetedIndicesRef.current = nextSet;
			return nextSet.size;
		},
		[effSize],
	);

	useEffect(() => {
		const animate = (ts: number) => {
			if (document.hidden) {
				lastTsRef.current = null;
				rafRef.current = requestAnimationFrame(animate);
				return;
			}
			if (lastTsRef.current === null) {
				lastTsRef.current = ts;
			}
			const dt = Math.min(0.035, Math.max(0.001, (ts - lastTsRef.current) / 1000));
			lastTsRef.current = ts;

			const bodies = bodiesRef.current;
			const entries = uniqueEntriesRef.current;
			const sRect = sanctuaryRectRef.current;
			const tStage = tournamentStageRef.current;
			const count = bodies.length;
			const r = effSize / 2;
			const pad = 10;
			const minX = r + pad;
			const maxX = Math.max(minX + 10, dims.w - r - pad);
			const minY = r + pad;
			const maxY = Math.max(minY + 40, dims.h - r - pad);
			const minDist = effSize + Math.max(6, gap * 0.5);

			// Forcefield perimeter around the morphing bottom Sanctuary Dock / Arena Stage
			const dockMargin = 8;
			const boxLeft = sRect.left - dockMargin;
			const boxRight = sRect.right + dockMargin;
			const boxTop = sRect.top - dockMargin;

			const ptr = pointerRef.current;
			const hoveredIdx = hoveredIndexRef.current;
			const isMarqueeDragging = dragRef.current.isMarquee;

			// Partition selected orbs by role
			const selectedIndices: number[] = [];
			const queuedIndices: number[] = [];
			const championIndices: number[] = [];
			for (let i = 0; i < count; i++) {
				const item = entries[i]?.item;
				if (item?.selected) {
					selectedIndices.push(i);
					if (item.isChampion) {
						championIndices.push(i);
					} else if (item.isQueuedSurvivor) {
						queuedIndices.push(i);
					}
				}
			}
			const selTotal = selectedIndices.length;
			const queuedTotal = queuedIndices.length;
			const champTotal = championIndices.length;

			if (!reduced) {
				if (tStage?.active) {
					// TOURNAMENT ARENA STAGE PHYSICS
					for (let sPos = 0; sPos < selTotal; sPos++) {
						const idx = selectedIndices[sPos];
						const b = bodies[idx];
						const item = entries[idx]?.item;
						if (!b || !item) {
							continue;
						}
						b.phase += dt * 1.5;

						let targetX = dims.w * 0.5;
						let targetY = sRect.top + sRect.chamberHeight * 0.5;
						let targetScale = 1;

						if (item.isChampion) {
							const cPos = Math.max(0, championIndices.indexOf(idx));
							const spread = champTotal > 1 ? (cPos === 0 ? -1 : 1) * (effSize * 0.52) : 0;
							targetX = dims.w * 0.5 + spread + Math.cos(b.phase) * 3.5;
							targetY = sRect.top + (isMobile ? 108 : 122) + Math.sin(b.phase * 1.2) * 3.5;
							targetScale = champTotal > 1 ? (isMobile ? 1.08 : 1.22) : isMobile ? 1.22 : 1.38;
						} else if (item.duelSide === "left" || item.duelSide === "right") {
							const isLeft = item.duelSide === "left";
							const pedestalCenterX =
								sRect.left +
								sRect.width * (isLeft ? (isMobile ? 0.25 : 0.27) : isMobile ? 0.75 : 0.73);
							const isDuo = tStage.tournamentMode === "2v2";
							const partnerIdx = item.duelPartnerIndex ?? 0;
							const partnerOffset = isDuo
								? (partnerIdx === 0 ? -1 : 1) * (effSize * (isMobile ? 0.36 : 0.44))
								: 0;
							const voteLift = item.isJustVotedWinner ? -12 : 0;

							targetX = pedestalCenterX + partnerOffset + Math.cos(b.phase) * 3;
							targetY = sRect.top + (isMobile ? 104 : 118) + voteLift + Math.sin(b.phase * 1.2) * 3;
							targetScale = item.isJustVotedWinner
								? isMobile
									? 1.24
									: 1.42
								: isDuo
									? isMobile
										? 0.94
										: 1.08
									: isMobile
										? 1.12
										: 1.28;
						} else {
							// Queued survivor orb waiting in the lower Sanctuary queue row
							const qPos = Math.max(0, queuedIndices.indexOf(idx));
							const innerQueueW = Math.max(effSize, sRect.width - effSize - (isMobile ? 48 : 96));
							const idealStep = Math.min(
								effSize * 0.82 + (isMobile ? 6 : 12),
								queuedTotal > 1 ? innerQueueW / (queuedTotal - 1) : 0,
							);
							const rowSpanW = idealStep * Math.max(0, queuedTotal - 1);
							const startX = (dims.w - rowSpanW) * 0.5;
							targetX = startX + qPos * idealStep + Math.cos(b.phase) * 2;
							targetY =
								sRect.top +
								sRect.chamberHeight -
								(isMobile ? 38 : 44) +
								Math.sin(b.phase * 1.15) * 2;
							targetScale = isMobile ? 0.66 : 0.74;
						}

						const dx = targetX - b.x;
						const dy = targetY - b.y;
						const springK = 22;
						const damping = 8.2;
						b.vx = (b.vx + dx * springK * dt) * Math.exp(-damping * dt);
						b.vy = (b.vy + dy * springK * dt) * Math.exp(-damping * dt);
						b.x += b.vx * dt;
						b.y += b.vy * dt;
						b.scale += (targetScale - b.scale) * Math.min(1, dt * 12);
					}
				} else {
					// SELECTION MODE SANCTUARY DOCK PHYSICS
					for (let sPos = 0; sPos < selTotal; sPos++) {
						const idx = selectedIndices[sPos];
						const b = bodies[idx];
						if (!b) {
							continue;
						}
						b.phase += dt * 1.4;

						const rowCount = Math.max(1, sRect.rows);
						const firstRowCount = rowCount > 1 ? Math.ceil(selTotal / 2) : selTotal;
						const rowIdx = rowCount > 1 && sPos >= firstRowCount ? 1 : 0;
						const itemsInThisRow =
							rowCount > 1 ? (rowIdx === 0 ? firstRowCount : selTotal - firstRowCount) : selTotal;
						const colInRow = rowIdx === 1 ? sPos - firstRowCount : sPos;

						const innerUsableW = Math.max(effSize, sRect.width - effSize - 36);
						const idealStep = Math.min(
							effSize + (isMobile ? 10 : 16),
							itemsInThisRow > 1 ? innerUsableW / (itemsInThisRow - 1) : 0,
						);
						const rowSpanW = idealStep * Math.max(0, itemsInThisRow - 1);
						const startX = (dims.w - rowSpanW) * 0.5;

						const targetX = startX + colInRow * idealStep + Math.cos(b.phase) * 3;
						const headerOffset = 26;
						const usableChamberH = Math.max(effSize, sRect.chamberHeight - headerOffset);
						const rowCenterY =
							rowCount > 1
								? sRect.top + headerOffset + ((rowIdx + 0.5) * usableChamberH) / 2
								: sRect.top + headerOffset + usableChamberH * 0.5;
						const targetY = rowCenterY + Math.sin(b.phase * 1.15) * 3;

						const dx = targetX - b.x;
						const dy = targetY - b.y;
						const springK = 20;
						const damping = 7.8;
						b.vx = (b.vx + dx * springK * dt) * Math.exp(-damping * dt);
						b.vy = (b.vy + dy * springK * dt) * Math.exp(-damping * dt);
						b.x += b.vx * dt;
						b.y += b.vy * dt;
						b.scale += (0.96 - b.scale) * Math.min(1, dt * 12);
					}
				}

				// 2. Update unselected & eliminated orbs (float in outer arena, attracted to mouse cursor, deflect off Sanctuary perimeter)
				for (let i = 0; i < count; i++) {
					if (entries[i]?.item.selected) {
						continue;
					}
					const b = bodies[i];
					if (!b) {
						continue;
					}
					b.scale += (1 - b.scale) * Math.min(1, dt * 10);

					// Check if this orb is currently inside the dock footprint (e.g. just eliminated or dock just expanded)
					const insideHoriz = b.x > boxLeft - r * 0.3 && b.x < boxRight + r * 0.3;
					const insideVert = b.y > boxTop - r * 0.4;
					if (insideHoriz && insideVert) {
						// Propel upward out of the Sanctuary Dock's top forcefield
						b.vy = -Math.max(Math.abs(b.vy), speed * 4.2, 240);
						b.y += b.vy * dt;
						b.x += b.vx * dt;
						continue;
					}

					// If targeted inside the active marquee box, gently damp velocity so caught orbs stay in the net
					if (isMarqueeDragging && targetedIndicesRef.current.has(i)) {
						b.vx *= Math.exp(-dt * 11);
						b.vy *= Math.exp(-dt * 11);
					} else if (pauseOnHover && hoveredIdx === i && !isMarqueeDragging) {
						b.vx *= Math.exp(-dt * 12);
						b.vy *= Math.exp(-dt * 12);
					} else {
						b.phase += dt * 0.9;
						b.vx += Math.cos(b.phase) * 8 * dt;
						b.vy += Math.sin(b.phase * 1.13) * 8 * dt;

						// Mouse attraction (only pulls when cursor is outside the Sanctuary Dock and not dragging a marquee box)
						const ptrInsideDock =
							ptr.x >= boxLeft && ptr.x <= boxRight && ptr.y >= boxTop && ptr.y <= sRect.bottom;
						if (ptr.active && !ptrInsideDock && !isMarqueeDragging) {
							const dx = ptr.x - b.x;
							const dy = ptr.y - b.y;
							const distSq = dx * dx + dy * dy;
							const dist = Math.sqrt(distSq) || 1;
							const attractRadius = Math.max(dims.w, dims.h) * 0.55;

							if (dist < attractRadius && dist > r * 0.85) {
								const falloff = 1 - dist / attractRadius;
								const pullStrength = 175 * falloff * (0.6 + falloff * 0.6);
								b.vx += (dx / dist) * pullStrength * dt;
								b.vy += (dy / dist) * pullStrength * dt;
							}
						}

						const curSpeed = Math.hypot(b.vx, b.vy) || 1;
						const minSpeed = speed * 0.55;
						const maxSpeed = ptr.active ? speed * 3.8 : speed * 2.1;
						if (curSpeed > maxSpeed) {
							const scale = maxSpeed / curSpeed;
							b.vx *= scale;
							b.vy *= scale;
						} else if (curSpeed < minSpeed) {
							const boost = (minSpeed - curSpeed) * 1.8 * dt;
							b.vx += (b.vx / curSpeed) * boost;
							b.vy += (b.vy / curSpeed) * boost;
						}
					}

					b.x += b.vx * dt;
					b.y += b.vy * dt;

					const bounceRestitution = 0.92;

					// Outer viewport walls
					if (b.x < minX) {
						b.x = minX;
						b.vx = Math.abs(b.vx) * bounceRestitution;
					} else if (b.x > maxX) {
						b.x = maxX;
						b.vx = -Math.abs(b.vx) * bounceRestitution;
					}

					if (b.y < minY) {
						b.y = minY;
						b.vy = Math.abs(b.vy) * bounceRestitution;
					} else if (b.y > maxY) {
						b.y = maxY;
						b.vy = -Math.abs(b.vy) * bounceRestitution;
					}

					// Circle-vs-AABB collision with the morphing Sanctuary Dock [boxLeft, boxRight] x [boxTop, dims.h + 100]
					const cx = Math.max(boxLeft, Math.min(b.x, boxRight));
					const cy = Math.max(boxTop, b.y);
					const dx = b.x - cx;
					const dy = b.y - cy;
					const distSq = dx * dx + dy * dy;

					if (distSq < r * r) {
						if (distSq > 0.0001) {
							const dist = Math.sqrt(distSq);
							const nx = dx / dist;
							const ny = dy / dist;
							b.x = cx + nx * (r + 1);
							b.y = cy + ny * (r + 1);
							const vn = b.vx * nx + b.vy * ny;
							if (vn < 0) {
								b.vx -= (1 + bounceRestitution) * vn * nx;
								b.vy -= (1 + bounceRestitution) * vn * ny;
							}
						} else {
							const dTop = Math.abs(b.y - boxTop);
							const dLeft = Math.abs(b.x - boxLeft);
							const dRight = Math.abs(b.x - boxRight);
							if (dTop <= dLeft && dTop <= dRight) {
								b.y = boxTop - r - 1;
								b.vy = -Math.max(Math.abs(b.vy) * bounceRestitution, speed * 1.3);
							} else if (dLeft < dRight) {
								b.x = boxLeft - r - 1;
								b.vx = -Math.max(Math.abs(b.vx) * bounceRestitution, speed * 1.2);
							} else {
								b.x = boxRight + r + 1;
								b.vx = Math.max(Math.abs(b.vx) * bounceRestitution, speed * 1.2);
							}
						}
					}
				}

				// 3. Pairwise elastic collision between unselected orbs
				for (let i = 0; i < count; i++) {
					if (entries[i]?.item.selected) {
						continue;
					}
					const a = bodies[i];
					if (!a) {
						continue;
					}
					for (let j = i + 1; j < count; j++) {
						if (entries[j]?.item.selected) {
							continue;
						}
						const b = bodies[j];
						if (!b) {
							continue;
						}
						const dx = b.x - a.x;
						const dy = b.y - a.y;
						const distSq = dx * dx + dy * dy;
						if (distSq < minDist * minDist && distSq > 0.0001) {
							const dist = Math.sqrt(distSq);
							const nx = dx / dist;
							const ny = dy / dist;
							const overlap = (minDist - dist) * 0.5;

							if (hoveredIdx === i) {
								b.x += nx * overlap * 2;
								b.y += ny * overlap * 2;
							} else if (hoveredIdx === j) {
								a.x -= nx * overlap * 2;
								a.y -= ny * overlap * 2;
							} else {
								a.x -= nx * overlap;
								a.y -= ny * overlap;
								b.x += nx * overlap;
								b.y += ny * overlap;
							}

							const rvx = b.vx - a.vx;
							const rvy = b.vy - a.vy;
							const velAlongNormal = rvx * nx + rvy * ny;
							if (velAlongNormal < 0) {
								const restitution = 0.85;
								const impulse = -(1 + restitution) * velAlongNormal * 0.5;
								if (hoveredIdx !== i) {
									a.vx -= impulse * nx;
									a.vy -= impulse * ny;
								}
								if (hoveredIdx !== j) {
									b.vx += impulse * nx;
									b.vy += impulse * ny;
								}
							}
						}
					}
				}
			}

			// 4. Commit orb transforms & dynamic scale to DOM nodes
			for (let i = 0; i < count; i++) {
				const b = bodies[i];
				const el = nodeRefs.current[i];
				if (!b || !el) {
					continue;
				}
				const tx = b.x - r;
				const ty = b.y - r;
				el.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) scale(${b.scale.toFixed(3)})`;
			}

			// 5. Update Custom Animated Mouse (Rodent) Cursor transform & swishing tail
			const cursorEl = mouseCursorRef.current;
			if (cursorEl && !isMobile) {
				const moveDx = ptr.x - ptr.prevX;
				const moveDy = ptr.y - ptr.prevY;
				const moveDist = Math.hypot(moveDx, moveDy);
				if (moveDist > 1.2) {
					const targetAngle = (Math.atan2(moveDy, moveDx) * 180) / Math.PI;
					let delta = ((targetAngle - ptr.angleDeg + 540) % 360) - 180;
					if (Number.isNaN(delta)) {
						delta = 0;
					}
					ptr.angleDeg += delta * Math.min(1, dt * 18);
					ptr.prevX = ptr.x;
					ptr.prevY = ptr.y;
				}

				const wagSpeed = 6.5 + Math.min(28, moveDist * 1.4);
				ptr.tailPhase = (ptr.tailPhase + dt * wagSpeed) % (Math.PI * 2);
				const wagAmp = reduced ? 1.5 : 4.2 + Math.min(6.5, moveDist * 0.35);
				const w1 = Math.sin(ptr.tailPhase) * wagAmp;
				const w2 = Math.cos(ptr.tailPhase * 0.85) * (wagAmp * 1.35);

				if (mouseTailPathRef.current) {
					mouseTailPathRef.current.setAttribute(
						"d",
						`M -21 0 Q -32 ${w1.toFixed(1)}, -43 ${(-w1 * 0.7).toFixed(1)} T -58 ${w2.toFixed(1)}`,
					);
				}

				const showCursor = ptr.active && !ptr.inFooter;
				const scale = ptr.pressing ? 0.91 : 1;
				cursorEl.style.opacity = showCursor ? "1" : "0";
				cursorEl.style.transform = `translate3d(${ptr.x.toFixed(1)}px, ${ptr.y.toFixed(1)}px, 0) rotate(${ptr.angleDeg.toFixed(1)}deg) scale(${scale})`;
			}

			rafRef.current = requestAnimationFrame(animate);
		};

		rafRef.current = requestAnimationFrame(animate);
		return () => {
			if (rafRef.current !== null) {
				cancelAnimationFrame(rafRef.current);
			}
		};
	}, [dims.w, dims.h, effSize, gap, isMobile, pauseOnHover, reduced, speed]);

	const releaseHover = useCallback(() => {
		hoveredIndexRef.current = -1;
		activeTileElRef.current?.classList.remove("is-active");
		activeTileElRef.current = null;
	}, []);

	const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
		if (e.button !== 0) {
			return;
		}
		const targetEl = e.target as HTMLElement | null;
		if (targetEl?.closest?.("[data-dock-footer='true']")) {
			return;
		}
		const rect = e.currentTarget.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		pointerRef.current.x = x;
		pointerRef.current.y = y;
		pointerRef.current.active = true;
		pointerRef.current.pressing = true;

		// Disable desktop marquee box dragging while tournament stage is active
		if (tournamentStageRef.current?.active) {
			return;
		}

		dragRef.current = {
			active: true,
			isMarquee: false,
			pointerId: e.pointerId,
			startX: x,
			startY: y,
			currX: x,
			currY: y,
			suppressClickUntil: dragRef.current.suppressClickUntil,
		};
	}, []);

	const handlePointerMove = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			const rect = e.currentTarget.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;
			const targetEl = e.target as HTMLElement | null;
			const inFooter = Boolean(targetEl?.closest?.("[data-dock-footer='true']"));

			pointerRef.current.x = x;
			pointerRef.current.y = y;
			pointerRef.current.active = true;
			pointerRef.current.inFooter = inFooter;

			// Handle active Windows-desktop-style marquee drag selection
			if (dragRef.current.active && !tournamentStageRef.current?.active) {
				dragRef.current.currX = x;
				dragRef.current.currY = y;
				const dist = Math.hypot(x - dragRef.current.startX, y - dragRef.current.startY);

				if (!dragRef.current.isMarquee && dist > 6) {
					dragRef.current.isMarquee = true;
					releaseHover();
					if (
						dragRef.current.pointerId !== null &&
						e.currentTarget.setPointerCapture &&
						!e.currentTarget.hasPointerCapture?.(dragRef.current.pointerId)
					) {
						try {
							e.currentTarget.setPointerCapture(dragRef.current.pointerId);
						} catch {
							// Ignore pointer capture errors on synthetic events
						}
					}
				}

				if (dragRef.current.isMarquee) {
					const left = Math.max(0, Math.min(dragRef.current.startX, x));
					const top = Math.max(0, Math.min(dragRef.current.startY, y));
					const right = Math.min(dims.w, Math.max(dragRef.current.startX, x));
					const bottom = Math.min(dims.h, Math.max(dragRef.current.startY, y));
					const targetedCount = syncMarqueeTargets(left, top, right, bottom);
					setMarqueeBox({
						left,
						top,
						width: Math.max(2, right - left),
						height: Math.max(2, bottom - top),
						targetedCount,
					});
					return;
				}
			}

			const tile = targetEl?.closest?.("[data-tile-id]") as HTMLElement | null;
			if (!tile) {
				releaseHover();
				return;
			}
			const bodyIndex = Number(tile.dataset.col);
			if (!Number.isNaN(bodyIndex) && bodyIndex !== hoveredIndexRef.current) {
				hoveredIndexRef.current = bodyIndex;
				activeTileElRef.current?.classList.remove("is-active");
				tile.classList.add("is-active");
				activeTileElRef.current = tile;
			}
		},
		[dims.w, dims.h, releaseHover, syncMarqueeTargets],
	);

	const finalizePointerUp = useCallback(
		(e: React.PointerEvent<HTMLDivElement>, cancelled = false) => {
			pointerRef.current.pressing = false;
			if (!dragRef.current.active) {
				return;
			}

			const wasMarquee = dragRef.current.isMarquee;
			const ptrId = dragRef.current.pointerId;
			dragRef.current.active = false;
			dragRef.current.isMarquee = false;
			dragRef.current.pointerId = null;

			if (
				ptrId !== null &&
				e.currentTarget.releasePointerCapture &&
				e.currentTarget.hasPointerCapture?.(ptrId)
			) {
				try {
					e.currentTarget.releasePointerCapture(ptrId);
				} catch {
					// Ignore release errors
				}
			}

			if (wasMarquee) {
				dragRef.current.suppressClickUntil = performance.now() + 160;
				const capturedIndices = Array.from(targetedIndicesRef.current);
				clearTargetedOrbs();
				setMarqueeBox(null);

				if (!cancelled && capturedIndices.length > 0) {
					const entries = uniqueEntriesRef.current;
					const capturedItems: DriftWallItem[] = [];
					for (const i of capturedIndices) {
						const entry = entries[i];
						if (entry && !entry.item.selected && !entry.item.locked) {
							capturedItems.push(entry.item);
						}
					}
					if (capturedItems.length > 0) {
						if (onItemsBatchSelect) {
							onItemsBatchSelect(capturedItems);
						} else if (onItemClick) {
							for (const item of capturedItems) {
								onItemClick(item, 0);
							}
						}
					}
				}
			}
		},
		[clearTargetedOrbs, onItemsBatchSelect, onItemClick],
	);

	const handleClickDelegated = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (performance.now() < dragRef.current.suppressClickUntil) {
				e.preventDefault();
				e.stopPropagation();
				return;
			}
			const tile = (e.target as HTMLElement | null)?.closest?.(
				"[data-tile-id]",
			) as HTMLElement | null;
			if (!tile) {
				return;
			}
			const idx = Number(tile.dataset.originalIndex);
			const item = items[idx];
			if (!item) {
				return;
			}

			// During an active tournament, clicking a dueling orb votes for that side directly
			if (tournamentStageRef.current?.active) {
				if (item.duelSide === "left" || item.duelSide === "right") {
					tournamentStageRef.current.onVoteSide?.(item.duelSide);
				}
				return;
			}

			item.onClick?.();
			onItemClick?.(item, idx);
		},
		[items, onItemClick],
	);

	const cssVars: CSSProperties = {
		"--dw-tile-w": `${effSize}px`,
		"--dw-tile-h": `${effSize}px`,
		"--dw-gap": "0px",
		"--dw-radius": typeof radius === "number" ? `${radius}px` : radius,
		"--dw-dim": dim,
		"--dw-gray": grayscale ? 1 : 0,
		"--dw-overlay": overlayColor,
		...style,
	} as CSSProperties;

	const isExpanded = sanctuaryRect.selectedCount > 0 || Boolean(tournamentStage?.active);

	return (
		<div
			ref={containerRef}
			className={`drift-wall ${isMobile ? "" : "drift-wall--custom-cursor"} ${
				reduced ? "drift-wall--reduced" : ""
			} ${className}`}
			style={cssVars}
			onClick={handleClickDelegated}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={(e) => finalizePointerUp(e, false)}
			onPointerCancel={(e) => finalizePointerUp(e, true)}
			onPointerEnter={(e) => {
				const rect = e.currentTarget.getBoundingClientRect();
				const x = e.clientX - rect.left;
				const y = e.clientY - rect.top;
				pointerRef.current.x = x;
				pointerRef.current.y = y;
				pointerRef.current.prevX = x;
				pointerRef.current.prevY = y;
				pointerRef.current.active = true;
			}}
			onPointerLeave={(e) => {
				pointerRef.current.active = false;
				pointerRef.current.pressing = false;
				releaseHover();
				if (dragRef.current.active) {
					finalizePointerUp(e, false);
				}
			}}
			role="group"
			aria-label="Floating space of contender orbs"
		>
			<div className="relative w-full h-full overflow-hidden">
				{/* Unified Morphing Sanctuary Command Dock / Tournament Arena Stage */}
				<motion.div
					aria-label={
						tournamentStage?.active
							? "Sanctuary Tournament Arena Stage"
							: isExpanded
								? "Expanded Sanctuary Command Dock"
								: "Tournament launch command dock"
					}
					initial={false}
					animate={{
						left: sanctuaryRect.left,
						top: sanctuaryRect.top,
						width: sanctuaryRect.width,
						height: sanctuaryRect.height,
						borderRadius: sanctuaryRect.borderRadius,
					}}
					transition={
						reduced
							? { duration: 0 }
							: {
									type: "spring",
									stiffness: 240,
									damping: 25,
									mass: 0.88,
								}
					}
					className="floating-navbar-shell pointer-events-none absolute z-20 flex flex-col justify-end overflow-hidden"
					style={{
						maxWidth: "none",
						borderColor: tournamentStage?.active
							? "oklch(var(--accent) / 0.58)"
							: isExpanded
								? "oklch(var(--accent) / 0.42)"
								: "var(--nav-shell-border)",
						boxShadow: tournamentStage?.active
							? "0 -18px 56px -6px oklch(var(--accent) / 0.42), 0 0 36px -8px oklch(var(--secondary-accent) / 0.28), var(--nav-shell-shadow), inset 0 1.5px 0 0 oklch(var(--accent) / 0.65)"
							: isExpanded
								? "0 -14px 42px -8px oklch(var(--accent) / 0.34), var(--nav-shell-shadow), inset 0 1px 0 0 oklch(var(--accent) / 0.55)"
								: "var(--nav-shell-shadow)",
					}}
				>
					{/* Glowing Forcefield Top Rim */}
					<div
						className={`pointer-events-none absolute top-0 left-6 right-6 h-[2.5px] bg-gradient-to-r from-transparent via-primary to-transparent transition-opacity duration-300 ${
							isExpanded ? "opacity-95" : "opacity-35"
						}`}
					/>

					{/* Forcefield Ripple Animation when an orb is captured or launched out on vote */}
					<AnimatePresence>
						{rippleKey > 0 && isExpanded && (
							<motion.div
								key={rippleKey}
								initial={{ opacity: 0.9, scaleX: 0.35, scaleY: 0.2 }}
								animate={{ opacity: 0, scaleX: 1.3, scaleY: 1.45 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.68, ease: [0.16, 1, 0.3, 1] }}
								className="pointer-events-none absolute inset-x-0 -top-6 h-32 rounded-full"
								style={{
									background:
										"radial-gradient(ellipse at 50% 0%, oklch(var(--accent) / 0.52) 0%, oklch(var(--secondary-accent) / 0.24) 48%, transparent 78%)",
								}}
							/>
						)}
					</AnimatePresence>

					{/* Upper Sanctuary Chamber / Tournament Arena Stage */}
					<AnimatePresence mode="wait">
						{tournamentStage?.active ? (
							<motion.div
								key="tournament-stage-chamber"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.22 }}
								className="pointer-events-none relative flex-1 w-full overflow-hidden"
								style={{
									background: tournamentStage.isComplete
										? "radial-gradient(circle at 50% 38%, oklch(var(--accent) / 0.26) 0%, oklch(var(--secondary-accent) / 0.12) 48%, transparent 78%)"
										: "radial-gradient(circle at 27% 38%, oklch(var(--accent) / 0.18) 0%, transparent 55%), radial-gradient(circle at 73% 38%, oklch(var(--secondary-accent) / 0.18) 0%, transparent 55%)",
								}}
							>
								{/* Stage Top Header Bar */}
								<div className="flex flex-col gap-1.5 px-4 sm:px-6 pt-2.5">
									<div className="flex items-center justify-between text-[11px] sm:text-xs font-medium tracking-wide text-foreground/85">
										<span className="flex items-center gap-2">
											<span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 border border-primary/35 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-primary">
												{tournamentStage.isComplete
													? "\u265B Tournament Complete"
													: `Round ${tournamentStage.round} \u00B7 ${tournamentStage.bracketStage}`}
											</span>
											{!tournamentStage.isComplete && (
												<span className="font-mono font-semibold tabular-nums text-foreground/80">
													Match {tournamentStage.matchNumber} of {tournamentStage.totalMatches}
												</span>
											)}
										</span>
										<span className="hidden sm:inline text-foreground/65 text-[11px]">
											{tournamentStage.isComplete
												? "The Sanctuary has crowned its champion!"
												: "Click a dueling orb or press \u2190 / \u2192 keys to vote"}
										</span>
									</div>

									{/* Progress Bar */}
									<div className="h-1 w-full overflow-hidden rounded-full bg-foreground/10">
										<div
											className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-300 ease-out"
											style={{
												width: `${tournamentStage.isComplete ? 100 : Math.max(6, tournamentStage.progress)}%`,
											}}
										/>
									</div>
								</div>

								{/* Active Matchup Pedestal Badges & Center VS Medallion */}
								{!tournamentStage.isComplete && (
									<>
										{/* Center VS Medallion */}
										<div
											className="pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center"
											style={{ top: `${isMobile ? 104 : 118}px` }}
										>
											<div className="flex size-10 sm:size-11 items-center justify-center rounded-full border border-foreground/20 bg-background/85 font-display text-xs sm:text-sm font-black tracking-wider text-foreground shadow-lg backdrop-blur-md">
												VS
											</div>
										</div>

										{/* Left Duelist Pedestal Action Pill */}
										<div
											data-dock-footer="true"
											onClick={(e) => e.stopPropagation()}
											onKeyDown={(e) => e.stopPropagation()}
											role="presentation"
											className="pointer-events-auto absolute -translate-x-1/2 flex flex-col items-center text-center z-30"
											style={{
												left: `${isMobile ? 25 : 27}%`,
												top: `${isMobile ? 164 : 188}px`,
											}}
										>
											<button
												type="button"
												disabled={tournamentStage.isVoting}
												onClick={() => tournamentStage.onVoteSide?.("left")}
												className={`group flex flex-col items-center gap-0.5 rounded-2xl border px-3 sm:px-4 py-1.5 backdrop-blur-md transition-all duration-150 ${
													tournamentStage.votingSide === "left"
														? "border-secondary bg-secondary/25 scale-105 shadow-lg"
														: "border-primary/35 bg-background/65 hover:border-primary hover:bg-primary/20 active:scale-95"
												}`}
												aria-label={`Vote Left for ${tournamentStage.leftLabel ?? "Left Contender"}`}
											>
												<div className="flex items-center gap-1.5">
													<span className="font-display text-xs sm:text-sm font-extrabold text-foreground group-hover:text-primary transition-colors max-w-[130px] sm:max-w-[180px] truncate">
														{tournamentStage.leftLabel}
													</span>
													{tournamentStage.leftElo && (
														<span className="hidden md:inline font-mono text-[10px] font-bold text-primary/85">
															{Math.round(tournamentStage.leftElo)}
														</span>
													)}
												</div>
												<span className="text-[10px] font-bold tracking-wider uppercase text-primary">
													&larr; Vote Left
												</span>
											</button>
										</div>

										{/* Right Duelist Pedestal Action Pill */}
										<div
											data-dock-footer="true"
											onClick={(e) => e.stopPropagation()}
											onKeyDown={(e) => e.stopPropagation()}
											role="presentation"
											className="pointer-events-auto absolute -translate-x-1/2 flex flex-col items-center text-center z-30"
											style={{
												left: `${isMobile ? 75 : 73}%`,
												top: `${isMobile ? 164 : 188}px`,
											}}
										>
											<button
												type="button"
												disabled={tournamentStage.isVoting}
												onClick={() => tournamentStage.onVoteSide?.("right")}
												className={`group flex flex-col items-center gap-0.5 rounded-2xl border px-3 sm:px-4 py-1.5 backdrop-blur-md transition-all duration-150 ${
													tournamentStage.votingSide === "right"
														? "border-secondary bg-secondary/25 scale-105 shadow-lg"
														: "border-secondary/40 bg-background/65 hover:border-secondary hover:bg-secondary/20 active:scale-95"
												}`}
												aria-label={`Vote Right for ${tournamentStage.rightLabel ?? "Right Contender"}`}
											>
												<div className="flex items-center gap-1.5">
													<span className="font-display text-xs sm:text-sm font-extrabold text-foreground group-hover:text-secondary transition-colors max-w-[130px] sm:max-w-[180px] truncate">
														{tournamentStage.rightLabel}
													</span>
													{tournamentStage.rightElo && (
														<span className="hidden md:inline font-mono text-[10px] font-bold text-secondary/90">
															{Math.round(tournamentStage.rightElo)}
														</span>
													)}
												</div>
												<span className="text-[10px] font-bold tracking-wider uppercase text-secondary">
													Vote Right &rarr;
												</span>
											</button>
										</div>

										{/* Lower Sanctuary Survivors Queue Divider */}
										{(tournamentStage.queuedCount ?? 0) > 0 && (
											<div
												className="pointer-events-none absolute inset-x-6 flex items-center justify-center gap-2"
												style={{ bottom: `${isMobile ? 74 : 84}px` }}
											>
												<div className="h-px flex-1 bg-foreground/10" />
												<span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
													Sanctuary Queue &middot; {tournamentStage.queuedCount} waiting
												</span>
												<div className="h-px flex-1 bg-foreground/10" />
											</div>
										)}
									</>
								)}

								{/* Champion Finale Banner inside the Sanctuary Stage */}
								{tournamentStage.isComplete && (
									<div
										className="pointer-events-none absolute inset-x-4 flex flex-col items-center text-center"
										style={{ top: `${isMobile ? 176 : 196}px` }}
									>
										<span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
											&#9819; Crowned Sanctuary Champion
										</span>
										<h3 className="mt-0.5 font-display text-xl sm:text-2xl font-black tracking-tight text-foreground">
											{tournamentStage.championLabel}
										</h3>
										{tournamentStage.championSub && (
											<p className="mt-0.5 max-w-md text-xs text-foreground/70 line-clamp-1">
												{tournamentStage.championSub}
											</p>
										)}
									</div>
								)}
							</motion.div>
						) : (
							isExpanded && (
								<motion.div
									key="sanctuary-chamber"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									transition={{ duration: 0.22 }}
									className="pointer-events-none relative flex-1 w-full"
									style={{
										background:
											"radial-gradient(circle at 50% 25%, oklch(var(--accent) / 0.14) 0%, transparent 75%)",
									}}
								>
									<div className="flex items-center justify-between px-5 pt-2.5 text-[11px] font-medium tracking-wide text-foreground/75">
										<span className="flex items-center gap-2">
											<span className="font-semibold text-primary">Selected Sanctuary</span>
											<span aria-hidden="true" className="text-foreground/35">
												&middot;
											</span>
											<span className="hidden sm:inline text-foreground/60">
												Tap any captured orb to release
											</span>
										</span>
										<span className="font-mono font-semibold tabular-nums text-primary">
											{sanctuaryRect.selectedCount}{" "}
											{sanctuaryRect.selectedCount === 1 ? "orb" : "orbs"}
										</span>
									</div>
								</motion.div>
							)
						)}
					</AnimatePresence>

					{/* Integrated Bottom Control Strip */}
					{dockFooter && (
						<div
							data-dock-footer="true"
							onClick={(e) => e.stopPropagation()}
							onKeyDown={(e) => e.stopPropagation()}
							role="presentation"
							className={`pointer-events-auto cursor-auto relative z-30 flex w-full shrink-0 items-center justify-between px-4 sm:px-6 ${
								isExpanded ? "border-t border-foreground/10 bg-background/40" : ""
							}`}
							style={{ height: `${sanctuaryRect.footerHeight}px` }}
						>
							{dockFooter}
						</div>
					)}
				</motion.div>

				{/* Floating & Captured Contender Orbs */}
				{uniqueEntries.map(({ item, originalIndex }, i) => (
					<div
						key={String(item.id ?? item.title ?? i)}
						ref={(el) => {
							nodeRefs.current[i] = el;
						}}
						className={`absolute top-0 left-0 will-change-transform ${
							item.isChampion || item.duelSide ? "z-30" : item.selected ? "z-25" : "z-10"
						}`}
						style={{ width: `${effSize}px`, height: `${effSize}px` }}
					>
						<DriftWallTile
							tileId={`orb-${String(item.id ?? i)}`}
							col={i}
							width={effSize}
							height={effSize}
							name={item.title || item.name || "tile"}
							orbitText={item.subtitle || item.orbitText || ""}
							isSelected={Boolean(item.selected)}
							duelSide={item.duelSide ?? null}
							isChampion={Boolean(item.isChampion)}
							isQueuedSurvivor={Boolean(item.isQueuedSurvivor)}
							isJustVotedWinner={Boolean(item.isJustVotedWinner)}
							image={item.image}
							href={item.href}
							originalIndex={originalIndex}
							brightness={item.brightness ?? brightness}
							opacity={item.opacity ?? opacity}
							blur={item.blur ?? blur}
							borderWidth={item.borderWidth ?? borderWidth}
						/>
					</div>
				))}

				{/* Windows-Desktop-Style Marquee Selection Box */}
				{marqueeBox && (
					<div
						aria-hidden="true"
						className="pointer-events-none absolute z-40 rounded-2xl border-2 border-secondary/85 bg-secondary/14 backdrop-blur-[2px] transition-colors"
						style={{
							left: `${marqueeBox.left}px`,
							top: `${marqueeBox.top}px`,
							width: `${marqueeBox.width}px`,
							height: `${marqueeBox.height}px`,
							boxShadow:
								"0 0 28px -4px oklch(var(--secondary-accent) / 0.48), inset 0 0 18px 0 oklch(var(--accent) / 0.22)",
						}}
					>
						{marqueeBox.targetedCount > 0 && (
							<div className="absolute -top-7 left-2 inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-bold text-secondary-foreground shadow-md whitespace-nowrap">
								<span className="font-mono tabular-nums">+{marqueeBox.targetedCount}</span>
								<span>
									{marqueeBox.targetedCount === 1 ? "cat name in net" : "cat names in net"}
								</span>
							</div>
						)}
					</div>
				)}

				{/* Custom Animated Mouse (Rodent) Cursor — cat orbs chase this mouse! */}
				{!isMobile && (
					<div
						ref={mouseCursorRef}
						aria-hidden="true"
						className="pointer-events-none absolute top-0 left-0 z-50 opacity-0 will-change-transform transition-opacity duration-150"
						style={{ width: 0, height: 0 }}
					>
						<svg
							width="96"
							height="64"
							viewBox="-64 -32 80 64"
							className="overflow-visible -translate-x-[64px] -translate-y-[32px]"
							style={{
								filter:
									"drop-shadow(0 4px 12px rgba(0, 0, 0, 0.48)) drop-shadow(0 0 10px oklch(var(--accent) / 0.45))",
							}}
						>
							<defs>
								<linearGradient id="mouse-fur-grad" x1="1" y1="0" x2="0" y2="0">
									<stop offset="0%" stopColor="#f8fafc" />
									<stop offset="65%" stopColor="#cbd5e1" />
									<stop offset="100%" stopColor="#94a3b8" />
								</linearGradient>
							</defs>

							{/* Swishing Pink Mouse Tail */}
							<path
								ref={mouseTailPathRef}
								d="M -21 0 Q -32 4, -43 -3 T -58 5"
								fill="none"
								stroke="var(--primary)"
								strokeWidth="2.8"
								strokeLinecap="round"
							/>

							{/* Back Paws */}
							<ellipse cx="-17" cy="-8.5" rx="3.2" ry="1.8" fill="#fda4af" />
							<ellipse cx="-17" cy="8.5" rx="3.2" ry="1.8" fill="#fda4af" />

							{/* Plump Teardrop Mouse Body (facing +X with nose at 0,0) */}
							<path
								d="M 0 0 C -3 -6.5, -9 -10.5, -15 -10.5 C -21.5 -10.5, -24.5 -5.8, -24.5 0 C -24.5 5.8, -21.5 10.5, -15 10.5 C -9 10.5, -3 6.5, 0 0 Z"
								fill="url(#mouse-fur-grad)"
								stroke="#334155"
								strokeWidth="1.4"
							/>

							{/* Rounded Mouse Ears */}
							<g transform="translate(-8.5, -8.2) rotate(-18)">
								<circle cx="0" cy="0" r="5.2" fill="#cbd5e1" stroke="#334155" strokeWidth="1.2" />
								<circle cx="0.4" cy="0.2" r="3.1" fill="var(--primary)" opacity="0.85" />
							</g>
							<g transform="translate(-8.5, 8.2) rotate(18)">
								<circle cx="0" cy="0" r="5.2" fill="#cbd5e1" stroke="#334155" strokeWidth="1.2" />
								<circle cx="0.4" cy="-0.2" r="3.1" fill="var(--primary)" opacity="0.85" />
							</g>

							{/* Whiskers */}
							<g stroke="#e2e8f0" strokeWidth="1" strokeLinecap="round" opacity="0.9">
								<line x1="-2.5" y1="-2.2" x2="4.5" y2="-8.5" />
								<line x1="-3.5" y1="-3" x2="2.5" y2="-11.5" />
								<line x1="-4.5" y1="-3.2" x2="-1" y2="-12" />
								<line x1="-2.5" y1="2.2" x2="4.5" y2="8.5" />
								<line x1="-3.5" y1="3" x2="2.5" y2="11.5" />
								<line x1="-4.5" y1="3.2" x2="-1" y2="12" />
							</g>

							{/* Bright Mouse Eyes */}
							<circle cx="-4.8" cy="-3.3" r="1.65" fill="#0f172a" />
							<circle cx="-4.3" cy="-3.6" r="0.6" fill="#ffffff" />
							<circle cx="-4.8" cy="3.3" r="1.65" fill="#0f172a" />
							<circle cx="-4.3" cy="3.0" r="0.6" fill="#ffffff" />

							{/* Pink Nose Tip right at Cursor Hotspot (0, 0) */}
							<circle
								cx="0"
								cy="0"
								r="2.4"
								fill="var(--primary)"
								stroke="#ffffff"
								strokeWidth="0.6"
							/>
						</svg>
					</div>
				)}
			</div>
		</div>
	);
});
