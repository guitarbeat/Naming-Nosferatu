import { motion } from "framer-motion";
import {
	type CSSProperties,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { handleImgError } from "@/lib/utils";

export interface DriftWallItem {
	image?: string;
	title?: string;
	subtitle?: string;
	href?: string;
	id?: string | number;
	selected?: boolean;
	locked?: boolean;
	onClick?: () => void;
	[key: string]: unknown;
}

interface DriftWallProps {
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
	className?: string;
	style?: CSSProperties;
	onItemClick?: (item: DriftWallItem, index: number) => void;
}

const DEFAULT_ITEMS: DriftWallItem[] = Array.from({ length: 15 }, (_, i) => {
	const ids = [
		1015, 1025, 1039, 1043, 1044, 1050, 1062, 1069, 1074, 1080, 1084, 106, 110, 133, 164,
	];
	return {
		image: `https://picsum.photos/id/${ids[i % ids.length]}/600/400`,
		title: `Tile ${i + 1}`,
		href: undefined,
	};
});

const prefersReducedMotion = () => {
	try {
		return (
			typeof window !== "undefined" &&
			typeof window.matchMedia === "function" &&
			window.matchMedia("(prefers-reduced-motion: reduce)").matches
		);
	} catch {
		return false;
	}
};

const columnFactor = (index: number, variance: number) => {
	const pseudo = ((index * 0.6180339887 + 0.35) % 1) * 2 - 1;
	return 1 + variance * pseudo;
};

export const DriftWall = ({
	items = DEFAULT_ITEMS,
	columns = 8,
	tileWidth = 116,
	tileHeight = 116,
	gap = 18,
	radius = 9999,
	tilt = 0,
	turn = 0,
	roll = 0,
	perspective = 1200,
	depth = 120,
	speed = 42,
	direction = "up",
	variance = 0.45,
	parallax = 0.6,
	pauseOnHover = true,
	lift = 64,
	fade = 0,
	dim = 1,
	grayscale = false,
	overlayColor = "#060010",
	className = "",
	style,
	onItemClick,
}: DriftWallProps) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const planeRef = useRef<HTMLDivElement>(null);
	const trackRefs = useRef<(HTMLDivElement | null)[]>([]);
	const rafRef = useRef<number | null>(null);

	const offsetsRef = useRef<number[]>([]);
	const velocitiesRef = useRef<number[]>([]);
	const hoveredColRef = useRef<number>(-1);
	const wallHoveredRef = useRef(false);
	const pointerRef = useRef({ x: 0, y: 0 });
	const pointerDampedRef = useRef({ x: 0, y: 0 });
	const lastTsRef = useRef<number | null>(null);

	const isIntersectingRef = useRef(true);

	useEffect(() => {
		if (!containerRef.current || typeof IntersectionObserver === "undefined") {
			return;
		}
		const observer = new IntersectionObserver(
			([entry]) => {
				isIntersectingRef.current = entry.isIntersecting;
			},
			{ threshold: 0 },
		);
		observer.observe(containerRef.current);
		return () => {
			observer.disconnect();
		};
	}, []);
	const [containerWidth, setContainerWidth] = useState(1200);
	const [containerHeight, setContainerHeight] = useState(600);
	const activeIdRef = useRef<string | null>(null);
	const activeTileElRef = useRef<HTMLElement | null>(null);
	const [reduced, setReduced] = useState(false);

	useEffect(() => {
		setReduced(prefersReducedMotion());
		if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
			return;
		}
		try {
			const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
			const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
			if (mq.addEventListener) {
				mq.addEventListener("change", onChange);
				return () => mq.removeEventListener("change", onChange);
			} else if (mq.addListener) {
				mq.addListener(onChange);
				return () => mq.removeListener(onChange);
			}
		} catch {
			// Ignore matchMedia listener failure
		}
	}, []);

	useLayoutEffect(() => {
		if (!containerRef.current) {
			return;
		}
		const ro = new ResizeObserver(([entry]) => {
			if (entry?.contentRect) {
				setContainerWidth(entry.contentRect.width || 1200);
				setContainerHeight(entry.contentRect.height || 600);
			}
		});
		ro.observe(containerRef.current);
		return () => ro.disconnect();
	}, []);

	const isMobile = containerWidth > 0 && containerWidth < 640;

	const effectiveTileWidth = isMobile ? Math.min(tileWidth, 100) : tileWidth;
	const effectiveTileHeight = isMobile
		? tileWidth === tileHeight
			? Math.min(tileHeight, 100)
			: Math.min(tileHeight, 95)
		: tileHeight;

	const effectiveColumns = useMemo(() => {
		const unit = effectiveTileWidth + gap;
		const fitting = Math.max(
			isMobile ? 2 : 4,
			Math.ceil((containerWidth + gap) / unit) + (isMobile ? 0 : 1),
		);
		if (columns) {
			return isMobile && containerWidth < 480 ? Math.min(columns, 3) : Math.max(columns, fitting);
		}
		return fitting;
	}, [containerWidth, effectiveTileWidth, gap, columns, isMobile]);

	const columnItems = useMemo(() => {
		if (!items.length) {
			return Array.from({ length: effectiveColumns }, () => []);
		}

		// 1. Strict deduplication of input items by ID or title so each contender is unique
		const seen = new Set<string>();
		const uniquePool: DriftWallItem[] = [];
		for (const item of items) {
			const key =
				item.id != null && String(item.id).trim()
					? String(item.id).trim()
					: item.title
						? item.title.trim().toLowerCase()
						: "";
			if (!key || !seen.has(key)) {
				if (key) {
					seen.add(key);
				}
				uniquePool.push(item);
			}
		}

		const totalUnique = uniquePool.length;
		if (totalUnique === 0) {
			return Array.from({ length: effectiveColumns }, () => []);
		}

		// 2. Distribute contenders across columns round-robin.
		// Each contender is assigned to exactly ONE column — zero duplicate contenders across columns!
		const cols: DriftWallItem[][] = Array.from({ length: effectiveColumns }, () => []);
		for (let i = 0; i < totalUnique; i++) {
			cols[i % effectiveColumns].push(uniquePool[i]);
		}

		// 3. Ensure track has sufficient vertical height for smooth infinite scrolling:
		// When unique items per column cover the viewport height, NO item ever repeats on screen simultaneously.
		const unit = effectiveTileHeight + gap;
		const minItemsPerCol = Math.max(3, Math.ceil((containerHeight * 1.2) / unit));

		for (let c = 0; c < effectiveColumns; c++) {
			if (cols[c].length === 0) {
				cols[c].push(uniquePool[c % totalUnique]);
			}
			// If a column still needs height to loop seamlessly (e.g. if the item pool is very small),
			// fill with remaining unique items using a rotation offset to maximize separation and prevent adjacent repeats.
			if (cols[c].length < minItemsPerCol && totalUnique > cols[c].length) {
				let step = 1;
				while (cols[c].length < minItemsPerCol && step < effectiveColumns) {
					const donorCol = (c + step) % effectiveColumns;
					const donorItems = cols[donorCol] || [];
					let added = false;
					for (const donorItem of donorItems) {
						if (!cols[c].includes(donorItem)) {
							cols[c].push(donorItem);
							added = true;
							if (cols[c].length >= minItemsPerCol) {
								break;
							}
						}
					}
					step++;
					if (!added) {
						break;
					}
				}
			}
		}

		return cols;
	}, [items, effectiveColumns, effectiveTileHeight, gap, containerHeight]);

	const columnMeta = useMemo(() => {
		const unit = effectiveTileHeight + gap;
		return columnItems.map((col) => {
			const copyHeight = Math.max(unit, col.length * unit);
			const copies = Math.max(2, Math.ceil((containerHeight * 1.6) / copyHeight) + 1);
			return { copyHeight, copies };
		});
	}, [columnItems, effectiveTileHeight, gap, containerHeight]);

	const baseVelocities = useMemo(() => {
		const dirSign = direction === "up" ? 1 : -1;
		return columnItems.map((_, c) => {
			const altSign = c % 2 === 0 ? 1 : -1;
			return speed * columnFactor(c, variance) * dirSign * altSign;
		});
	}, [columnItems, speed, direction, variance]);

	useEffect(() => {
		offsetsRef.current = columnMeta.map(
			(meta, c) => offsetsRef.current[c] ?? meta.copyHeight * ((c * 0.37) % 1),
		);
		velocitiesRef.current = columnItems.map((_, c) => velocitiesRef.current[c] ?? 0);
	}, [columnMeta, columnItems]);

	const applyPlaneTransform = useCallback(
		(px: number, py: number) => {
			const plane = planeRef.current;
			if (!plane) {
				return;
			}
			plane.style.transform =
				"translate(-50%, -50%) scale(0.95) " +
				`rotateX(${tilt + py}deg) rotateY(${turn + px}deg) rotateZ(${roll}deg) ` +
				`translateZ(${-depth}px)`;
		},
		[tilt, turn, roll, depth],
	);

	useLayoutEffect(() => {
		applyPlaneTransform(0, 0);
	}, [applyPlaneTransform]);

	useEffect(() => {
		const animate = (ts: number) => {
			if (!isIntersectingRef.current) {
				lastTsRef.current = null;
				rafRef.current = requestAnimationFrame(animate);
				return;
			}
			if (lastTsRef.current === null) {
				lastTsRef.current = ts;
			}
			const dt = Math.min(0.05, Math.max(0, ts - lastTsRef.current) / 1000);
			lastTsRef.current = ts;

			const maxTilt = parallax * 8;
			const targetX = pointerRef.current.x * maxTilt;
			const targetY = -pointerRef.current.y * maxTilt;
			const damp = 1 - Math.exp(-dt / 0.12);
			pointerDampedRef.current.x += (targetX - pointerDampedRef.current.x) * damp;
			pointerDampedRef.current.y += (targetY - pointerDampedRef.current.y) * damp;
			applyPlaneTransform(pointerDampedRef.current.x, pointerDampedRef.current.y);

			if (reduced) {
				applyPlaneTransform(0, 0);
				for (let c = 0; c < trackRefs.current.length; c++) {
					const el = trackRefs.current[c];
					const meta = columnMeta[c];
					if (el && meta) {
						el.style.transform = `translate3d(0, ${-(offsetsRef.current[c] ?? 0)}px, 0)`;
					}
				}
				return;
			}

			for (let c = 0; c < trackRefs.current.length; c++) {
				const meta = columnMeta[c];
				if (!meta) {
					continue;
				}
				const paused = wallHoveredRef.current && pauseOnHover;
				const factor = paused || hoveredColRef.current === c ? 0 : 1;
				const target = (baseVelocities[c] ?? 0) * factor;

				const ease = 1 - Math.exp(-dt / (target === 0 ? 0.16 : 0.28));
				const currentVel = velocitiesRef.current[c] ?? 0;
				const nextVel = currentVel + (target - currentVel) * ease;
				velocitiesRef.current[c] = nextVel;

				let next = (offsetsRef.current[c] ?? 0) + nextVel * dt;
				next = ((next % meta.copyHeight) + meta.copyHeight) % meta.copyHeight;
				offsetsRef.current[c] = next;

				const el = trackRefs.current[c];
				if (el) {
					el.style.transform = `translate3d(0, ${-next}px, 0)`;
				}
			}

			rafRef.current = requestAnimationFrame(animate);
		};

		rafRef.current = requestAnimationFrame(animate);
		return () => {
			if (rafRef.current) {
				cancelAnimationFrame(rafRef.current);
			}
			rafRef.current = null;
			lastTsRef.current = null;
		};
	}, [baseVelocities, columnMeta, pauseOnHover, parallax, reduced, applyPlaneTransform]);

	const activate = useCallback((id: string, index: number, el?: HTMLElement | null) => {
		activeIdRef.current = id;
		hoveredColRef.current = index;
		if (activeTileElRef.current && activeTileElRef.current !== el) {
			activeTileElRef.current.classList.remove("is-active");
		}
		if (el) {
			el.classList.add("is-active");
			activeTileElRef.current = el;
		}
	}, []);

	const release = useCallback(() => {
		activeIdRef.current = null;
		hoveredColRef.current = -1;
		if (activeTileElRef.current) {
			activeTileElRef.current.classList.remove("is-active");
			activeTileElRef.current = null;
		}
	}, []);

	const handlePointerMove = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			const rect = e.currentTarget.getBoundingClientRect();
			if (!rect) {
				return;
			}
			if (parallax > 0 && !reduced) {
				pointerRef.current = {
					x: (e.clientX - rect.left) / rect.width - 0.5,
					y: (e.clientY - rect.top) / rect.height - 0.5,
				};
			}
			const targetEl = e.target as HTMLElement | null;
			const tile =
				targetEl && typeof targetEl.closest === "function"
					? (targetEl.closest("[data-tile-id]") as HTMLElement | null)
					: null;
			if (!tile) {
				if (activeIdRef.current) {
					release();
				}
				return;
			}
			const id = tile.dataset.tileId;
			if (id && id === activeIdRef.current) {
				return;
			}
			if (id) {
				activate(id, Number(tile.dataset.col), tile);
			}
		},
		[parallax, reduced, activate, release],
	);

	const handlePointerLeaveWall = useCallback(() => {
		wallHoveredRef.current = false;
		pointerRef.current = { x: 0, y: 0 };
		release();
	}, [release]);

	const cssVars = useMemo(
		() =>
			({
				"--dw-tile-w": `${effectiveTileWidth}px`,
				"--dw-tile-h": `${effectiveTileHeight}px`,
				"--dw-gap": `${gap}px`,
				"--dw-radius": typeof radius === "number" ? `${radius}px` : radius,
				"--dw-perspective": `${perspective}px`,
				"--dw-lift": `${lift}px`,
				"--dw-dim": dim,
				"--dw-gray": grayscale ? 1 : 0,
				"--dw-overlay": overlayColor,
				"--dw-edge": `${Math.max(0, (1 - fade) * 100)}%`,
				...style,
			}) as CSSProperties,
		[
			effectiveTileWidth,
			effectiveTileHeight,
			gap,
			radius,
			perspective,
			lift,
			dim,
			grayscale,
			overlayColor,
			fade,
			style,
		],
	);

	const handleTileClick = useCallback(
		(item: DriftWallItem, originalIndex: number) => {
			if (item.onClick) {
				item.onClick();
			}
			if (onItemClick) {
				onItemClick(item, originalIndex);
			}
		},
		[onItemClick],
	);

	const renderTile = (
		item: DriftWallItem,
		id: string,
		colIndex: number,
		originalIndex: number,
		itemIndex: number,
		copyIndex: number,
	) => {
		const pathId = `textpath-${id.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
		const desc = item.subtitle ? String(item.subtitle).trim() : "";
		const title = item.title ? String(item.title).trim() : "";

		// Dynamic font size and letter-spacing scaling for maximum curved text legibility
		const descLen = desc.length;
		const descFontSize =
			descLen > 65 ? 9.8 : descLen > 50 ? 10.5 : descLen > 35 ? 11.5 : descLen > 20 ? 12.5 : 13.5;
		const descLetterSpacing =
			descLen > 65 ? 0.4 : descLen > 50 ? 0.5 : descLen > 35 ? 0.6 : descLen > 20 ? 0.7 : 0.8;

		const titleLen = title.length;
		const titleFontSize = titleLen > 11 ? 16 : titleLen > 8 ? 18.5 : titleLen > 5 ? 21.5 : 24.5;

		const fullLabel = title ? (desc ? `${title} - ${desc}` : title) : "tile";

		// Compute repeated orbit phrase with clean space separation (no diamond)
		const spacer = "\u00A0\u00A0\u00A0\u00A0\u00A0";
		const baseOrbitUnit = desc ? `${desc}${spacer}` : `${title}${spacer}`;
		const approxCharWidth = descFontSize * 0.54 + descLetterSpacing;
		const unitWidth = Math.max(40, baseOrbitUnit.length * approxCharWidth);
		const reps = Math.max(1, Math.min(3, Math.floor(496 / unitWidth)));
		const orbitPhrase = baseOrbitUnit.repeat(reps);

		// Closed 360-degree circle path of radius 79 centered at (100, 100)
		const circlePath = "M 100 21 A 79 79 0 1 1 99.9 21 Z";

		// Calm, smooth spin speed (26s - 38s)
		const spinDuration = 26 + (originalIndex % 4) * 4;
		const spinDirection = originalIndex % 2 === 0 ? "normal" : "reverse";

		// Staggered entry animation with Framer Motion:
		// Produces an organic diagonal cascade across columns and rows upon initial load
		const staggerDelay = reduced
			? 0
			: Math.min(0.95, 0.04 + colIndex * 0.055 + copyIndex * 0.16 + itemIndex * 0.065);

		const tileMotionProps = {
			initial: reduced ? false : { opacity: 0, y: 32 },
			animate: { opacity: 1, y: 0 },
			transition: {
				duration: 0.55,
				delay: staggerDelay,
				ease: [0.21, 1, 0.36, 1] as const,
			},
		};

		const inner = (
			<span className="drift-wall__inner">
				{Boolean(item.image) && (
					<img
						src={item.image}
						alt={title || "tile"}
						loading="lazy"
						decoding="async"
						draggable={false}
						onError={handleImgError}
					/>
				)}
				{Boolean(title) && (
					<svg
						className="drift-wall__svg-face"
						viewBox="0 0 200 200"
						aria-hidden="true"
						focusable="false"
					>
						<defs>
							<path id={pathId} d={circlePath} fill="none" />
						</defs>
						<g
							className="drift-wall__orbit-group"
							style={{
								animationDuration: `${spinDuration}s`,
								animationDirection: spinDirection,
							}}
						>
							<text
								className="drift-wall__arc-text"
								dominantBaseline="central"
								textAnchor="start"
								style={{
									fontSize: `${descFontSize}px`,
									letterSpacing: `${descLetterSpacing}px`,
								}}
							>
								<textPath href={`#${pathId}`} startOffset="0%" textAnchor="start">
									{orbitPhrase}
								</textPath>
							</text>
						</g>
						<text
							x="100"
							y="100"
							className="drift-wall__center-name"
							dominantBaseline="central"
							textAnchor="middle"
							style={{ fontSize: `${titleFontSize}px` }}
						>
							{title}
						</text>
					</svg>
				)}
				{Boolean(item.image) && <span className="drift-wall__overlay" aria-hidden="true" />}
			</span>
		);
		const commonProps = {
			className: `drift-wall__tile${item.selected ? " is-selected" : ""}`,
			"data-tile-id": id,
			"data-col": colIndex,
			"aria-pressed": item.selected,
			onFocus: (e: React.FocusEvent<HTMLElement>) => activate(id, colIndex, e.currentTarget),
			onBlur: release,
			onClick: () => handleTileClick(item, originalIndex),
		};
		if (item.href) {
			return (
				<motion.a
					key={id}
					href={item.href}
					target="_blank"
					rel="noreferrer noopener"
					aria-label={fullLabel}
					{...tileMotionProps}
					{...commonProps}
				>
					{inner}
				</motion.a>
			);
		}
		return (
			<motion.div
				key={id}
				tabIndex={0}
				role="button"
				aria-label={fullLabel}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						handleTileClick(item, originalIndex);
					}
				}}
				{...tileMotionProps}
				{...commonProps}
			>
				{inner}
			</motion.div>
		);
	};

	const rootClass = ["drift-wall", reduced ? "drift-wall--reduced" : "", className]
		.filter(Boolean)
		.join(" ");

	return (
		<div
			ref={containerRef}
			className={rootClass}
			style={cssVars}
			onPointerMove={handlePointerMove}
			onPointerEnter={() => {
				wallHoveredRef.current = true;
			}}
			onPointerLeave={handlePointerLeaveWall}
			role="group"
			aria-label="Drifting wall of tiles"
		>
			<div ref={planeRef} className="drift-wall__plane">
				{columnItems.map((col, c) => {
					const meta = columnMeta[c];
					if (!meta) {
						return null;
					}
					const copies = Array.from({ length: meta.copies });
					return (
						<div className="drift-wall__col" key={`col-${c}`}>
							<div
								className="drift-wall__track"
								ref={(el) => {
									trackRefs.current[c] = el;
								}}
							>
								{copies.map((_, copyIndex) =>
									col.map((item, itemIndex) =>
										renderTile(
											item,
											`${c}-${copyIndex}-${itemIndex}`,
											c,
											items.indexOf(item) === -1 ? itemIndex : items.indexOf(item),
											itemIndex,
											copyIndex,
										),
									),
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};
