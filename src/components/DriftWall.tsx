import {
	type CSSProperties,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { DriftWallTile } from "./DriftWallTile";
import { triggerGlobalScroll } from "./GlassSurface";

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
	displace?: number;
	distortionScale?: number;
	redOffset?: number;
	greenOffset?: number;
	blueOffset?: number;
	brightness?: number;
	opacity?: number;
	blur?: number;
	borderWidth?: number;
	borderRadius?: number;
	mixBlendMode?: string;
	onClick?: () => void;
	[key: string]: unknown;
}

const DRIFT_WALL_DATA: DriftWallItem[] = [
	{
		id: "cosmo",
		title: "Cosmo",
		name: "Cosmo",
		subtitle: "Cosmic Explorer",
		orbitText: "Cosmic Explorer",
	},
	{
		id: "miso",
		title: "Miso",
		name: "Miso",
		subtitle: "Warm & Savory",
		orbitText: "Warm & Savory",
	},
	{
		id: "churro",
		title: "Churro",
		name: "Churro",
		subtitle: "Cinnamon Twist",
		orbitText: "Cinnamon Twist",
	},
	{
		id: "noodle",
		title: "Noodle",
		name: "Noodle",
		subtitle: "Long & Wobbly",
		orbitText: "Long & Wobbly",
	},
	{
		id: "fig",
		title: "Fig",
		name: "Fig",
		subtitle: "Sweet Little Tree",
		orbitText: "Sweet Little Tree",
	},
	{
		id: "shadow",
		title: "Shadow",
		name: "Shadow",
		subtitle: "Midnight Prowler",
		orbitText: "Midnight Prowler",
	},
	{
		id: "gizmo",
		title: "Gizmo",
		name: "Gizmo",
		subtitle: "Clever Tinkerer",
		orbitText: "Clever Tinkerer",
	},
	{
		id: "simon",
		title: "Simon",
		name: "Simon",
		subtitle: "Gentle Velvet Paws",
		orbitText: "Gentle Velvet Paws",
	},
	{
		id: "atticus",
		title: "Atticus",
		name: "Atticus",
		subtitle: "Noble & Wise Thinker",
		orbitText: "Noble & Wise Thinker",
	},
	{
		id: "binx",
		title: "Binx",
		name: "Binx",
		subtitle: "Shadow Familiar",
		orbitText: "Shadow Familiar",
	},
	{
		id: "luna",
		title: "Luna",
		name: "Luna",
		subtitle: "Moonlit Dreamer",
		orbitText: "Moonlit Dreamer",
	},
	{
		id: "clover",
		title: "Clover",
		name: "Clover",
		subtitle: "Lucky Four-Leaf",
		orbitText: "Lucky Four-Leaf",
	},
	{
		id: "basil",
		title: "Basil",
		name: "Basil",
		subtitle: "Fresh Fragrant Herb",
		orbitText: "Fresh Fragrant Herb",
	},
	{
		id: "salem",
		title: "Salem",
		name: "Salem",
		subtitle: "Midnight Enchanter",
		orbitText: "Midnight Enchanter",
	},
	{
		id: "smeemo",
		title: "Smeemo",
		name: "Smeemo",
		subtitle: "Curious Spirit",
		orbitText: "Curious Spirit",
	},
	{
		id: "peanut",
		title: "Peanut",
		name: "Peanut",
		subtitle: "Tiny Butterball",
		orbitText: "Tiny Butterball",
	},
	{
		id: "pepper",
		title: "Pepper",
		name: "Pepper",
		subtitle: "Spicy Firecracker",
		orbitText: "Spicy Firecracker",
	},
	{
		id: "dumpling",
		title: "Dumpling",
		name: "Dumpling",
		subtitle: "Steamed Bun",
		orbitText: "Steamed Bun",
	},
	{ id: "suki", title: "Suki", name: "Suki", subtitle: "Golden Heart", orbitText: "Golden Heart" },
	{
		id: "casper",
		title: "Casper",
		name: "Casper",
		subtitle: "Friendly Ghost",
		orbitText: "Friendly Ghost",
	},
	{
		id: "boris",
		title: "Boris",
		name: "Boris",
		subtitle: "Gentle Giant",
		orbitText: "Gentle Giant",
	},
];

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
	displace?: number;
	distortionScale?: number;
	redOffset?: number;
	greenOffset?: number;
	blueOffset?: number;
	brightness?: number;
	opacity?: number;
	blur?: number;
	borderWidth?: number;
	mixBlendMode?: string;
	className?: string;
	style?: CSSProperties;
	onItemClick?: (item: DriftWallItem, index: number) => void;
}

const DEFAULT_ITEMS: DriftWallItem[] = DRIFT_WALL_DATA;

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

const copyIndicesCache: number[][] = [];
function getCopyIndices(copies: number): number[] {
	let cached = copyIndicesCache[copies];
	if (!cached) {
		cached = Array.from({ length: copies }, (_, i) => i);
		copyIndicesCache[copies] = cached;
	}
	return cached;
}

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
	displace = 0,
	distortionScale = -160,
	redOffset = 5,
	greenOffset = 15,
	blueOffset = 25,
	brightness = 60,
	opacity = 0.85,
	blur = 11,
	borderWidth = 0.16,
	mixBlendMode = "screen",
	className = "",
	style,
	onItemClick,
}: DriftWallProps) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const planeRef = useRef<HTMLDivElement>(null);
	const trackRefs = useRef<(HTMLDivElement | null)[]>([]);
	const rafRef = useRef<number | null>(null);

	const startLoopRef = useRef<(() => void) | null>(null);
	const offsetsRef = useRef<number[]>([]);
	const velocitiesRef = useRef<number[]>([]);
	const wheelDeltaRef = useRef(0);
	const wheelVelocityRef = useRef(0);
	const hoveredColRef = useRef<number>(-1);
	const wallHoveredRef = useRef(false);
	const pointerRef = useRef({ x: 0, y: 0 });
	const pointerDampedRef = useRef({ x: 0, y: 0 });
	const lastTsRef = useRef<number | null>(null);
	const containerRectRef = useRef<DOMRect | null>(null);

	const isIntersectingRef = useRef(true);
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

		// 2. Distribute contenders across columns round-robin deterministically.
		const cols: DriftWallItem[][] = Array.from({ length: effectiveColumns }, () => []);
		for (let i = 0; i < totalUnique; i++) {
			cols[i % effectiveColumns].push(uniquePool[i]);
		}

		// Ensure every column has at least 1 item
		for (let c = 0; c < effectiveColumns; c++) {
			if (cols[c].length === 0) {
				cols[c].push(uniquePool[c % totalUnique]);
			}
		}

		return cols;
	}, [items, effectiveColumns]);

	const columnMeta = useMemo(() => {
		const unit = effectiveTileHeight + gap;
		return columnItems.map((col) => {
			const count = Math.max(1, col.length);
			const copyHeight = count * unit;
			// Render buffer copies proportionally: fewer on mobile to conserve memory and DOM nodes
			const copies = isMobile
				? Math.max(2, Math.ceil((containerHeight * 1.4) / copyHeight) + 1)
				: Math.max(3, Math.ceil((containerHeight * 2.2) / copyHeight) + 1);
			const copyIndices = getCopyIndices(copies);
			return { copyHeight, copies, copyIndices };
		});
	}, [columnItems, effectiveTileHeight, gap, containerHeight, isMobile]);

	const baseVelocities = useMemo(() => {
		const dirSign = direction === "up" ? 1 : -1;
		return columnItems.map((_, c) => {
			const altSign = c % 2 === 0 ? 1 : -1;
			return speed * columnFactor(c, variance) * dirSign * altSign;
		});
	}, [columnItems, speed, direction, variance]);

	useEffect(() => {
		offsetsRef.current = columnMeta.map((meta, c) => {
			const existing = offsetsRef.current[c];
			if (typeof existing === "number" && !Number.isNaN(existing)) {
				return ((existing % meta.copyHeight) + meta.copyHeight) % meta.copyHeight;
			}
			return (meta.copyHeight * (c * 0.382)) % meta.copyHeight;
		});
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
		let isIntersecting = isIntersectingRef.current;

		const startLoop = () => {
			if (rafRef.current === null && isIntersecting && !document.hidden) {
				lastTsRef.current = null;
				rafRef.current = requestAnimationFrame(animate);
			}
		};
		startLoopRef.current = startLoop;

		const stopLoop = () => {
			if (rafRef.current !== null) {
				cancelAnimationFrame(rafRef.current);
				rafRef.current = null;
			}
			lastTsRef.current = null;
		};

		const animate = (ts: number) => {
			if (!isIntersecting || document.hidden) {
				stopLoop();
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

			// Ingest accumulated wheel delta with smooth decay into RAF loop
			const pendingWheel = wheelDeltaRef.current;
			if (pendingWheel !== 0) {
				wheelVelocityRef.current += pendingWheel * 0.9;
				wheelDeltaRef.current = 0;
			}
			const wheelImpulse = wheelVelocityRef.current;
			if (Math.abs(wheelImpulse) > 0.05) {
				wheelVelocityRef.current *= Math.exp(-dt / 0.18);
			} else {
				wheelVelocityRef.current = 0;
			}

			if (reduced) {
				applyPlaneTransform(0, 0);
				for (let c = 0; c < trackRefs.current.length; c++) {
					const el = trackRefs.current[c];
					const meta = columnMeta[c];
					if (el && meta) {
						if (Math.abs(wheelImpulse) > 0.05) {
							const colDir = c % 2 === 0 ? 1 : -1;
							let next = (offsetsRef.current[c] ?? 0) + wheelImpulse * dt * 0.45 * colDir;
							next = ((next % meta.copyHeight) + meta.copyHeight) % meta.copyHeight;
							offsetsRef.current[c] = next;
						}
						el.style.transform = `translate3d(0, ${-(offsetsRef.current[c] ?? 0)}px, 0)`;
					}
				}
				if (Math.abs(wheelImpulse) > 0.05) {
					rafRef.current = requestAnimationFrame(animate);
				} else {
					rafRef.current = null;
					lastTsRef.current = null;
				}
				return;
			}

			const isAnyTileActive = activeIdRef.current !== null || hoveredColRef.current !== -1;
			const isFocusedInWall = containerRef.current?.contains(document.activeElement);

			for (let c = 0; c < trackRefs.current.length; c++) {
				const meta = columnMeta[c];
				if (!meta) {
					continue;
				}

				// Pause scrolling when hovering directly over a name/tile or navigating with keyboard
				let factor = 1;
				if (pauseOnHover) {
					if (hoveredColRef.current === c || (isFocusedInWall && activeIdRef.current !== null)) {
						// Complete pause on the hovered or active name column to assist selection
						factor = 0;
					} else if (isAnyTileActive) {
						// Gentle slow-down on other columns while inspecting a name
						factor = 0.2;
					} else if (wallHoveredRef.current) {
						factor = 0.4;
					}
				}

				const target = (baseVelocities[c] ?? 0) * factor;

				const ease = 1 - Math.exp(-dt / (target === 0 ? 0.16 : 0.28));
				const currentVel = velocitiesRef.current[c] ?? 0;
				const nextVel = currentVel + (target - currentVel) * ease;
				velocitiesRef.current[c] = nextVel;

				const colDir = c % 2 === 0 ? 1 : -1;
				let next = (offsetsRef.current[c] ?? 0) + nextVel * dt + wheelImpulse * dt * 0.45 * colDir;
				next = ((next % meta.copyHeight) + meta.copyHeight) % meta.copyHeight;
				offsetsRef.current[c] = next;

				const el = trackRefs.current[c];
				if (el) {
					el.style.transform = `translate3d(0, ${-next}px, 0)`;
				}
			}

			rafRef.current = requestAnimationFrame(animate);
		};

		const observer =
			typeof IntersectionObserver !== "undefined" && containerRef.current
				? new IntersectionObserver(
						([entry]) => {
							isIntersecting = entry.isIntersecting;
							isIntersectingRef.current = isIntersecting;
							if (isIntersecting) {
								startLoop();
							} else {
								stopLoop();
							}
						},
						{ threshold: 0 },
					)
				: null;

		if (observer && containerRef.current) {
			observer.observe(containerRef.current);
		}

		const handleVisibilityChange = () => {
			if (document.hidden) {
				stopLoop();
			} else if (isIntersecting) {
				startLoop();
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);

		startLoop();

		return () => {
			stopLoop();
			startLoopRef.current = null;
			if (observer) {
				observer.disconnect();
			}
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [baseVelocities, columnMeta, pauseOnHover, parallax, reduced, applyPlaneTransform]);

	const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
		// Accumulate wheel delta to be processed in the next RAF frame to eliminate stutter and layout thrashing
		wheelDeltaRef.current += e.deltaY;
		triggerGlobalScroll();
		if (rafRef.current === null) {
			startLoopRef.current?.();
		}
	}, []);

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
			let rect = containerRectRef.current;
			if (!rect) {
				rect = e.currentTarget.getBoundingClientRect();
				containerRectRef.current = rect;
			}
			if (parallax > 0 && !reduced && rect && rect.width > 0 && rect.height > 0) {
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

	const handlePointerEnter = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
		wallHoveredRef.current = true;
		containerRectRef.current = e.currentTarget.getBoundingClientRect();
	}, []);

	const handlePointerLeaveWall = useCallback(() => {
		wallHoveredRef.current = false;
		containerRectRef.current = null;
		pointerRef.current = { x: 0, y: 0 };
		release();
	}, [release]);

	// Keyboard navigation support: Up/Down/Left/Right/Home/End with seamless loop-around
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const active = document.activeElement as HTMLElement | null;
			if (
				active &&
				(active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable)
			) {
				return;
			}

			const key = e.key;
			if (
				key !== "ArrowUp" &&
				key !== "ArrowDown" &&
				key !== "ArrowLeft" &&
				key !== "ArrowRight" &&
				key !== "Home" &&
				key !== "End" &&
				key !== "PageUp" &&
				key !== "PageDown"
			) {
				return;
			}

			const container = containerRef.current;
			if (!container) {
				return;
			}

			const containerRect = container.getBoundingClientRect();
			const allTiles = Array.from(container.querySelectorAll<HTMLElement>("[data-tile-id]")).filter(
				(el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true",
			);

			if (allTiles.length === 0) {
				return;
			}

			// Identify current active tile
			let currentTile: HTMLElement | null = null;
			if (active && allTiles.includes(active)) {
				currentTile = active;
			} else if (activeIdRef.current) {
				currentTile = allTiles.find((t) => t.dataset.tileId === activeIdRef.current) || null;
			}

			// If no tile currently active, pick the middle-most visible tile
			if (!currentTile) {
				const visible = allTiles
					.map((el) => ({ el, rect: el.getBoundingClientRect() }))
					.filter(
						(t) => t.rect.bottom > containerRect.top + 40 && t.rect.top < containerRect.bottom - 40,
					);
				const target =
					visible.length > 0 ? visible[Math.floor(visible.length / 2)].el : allTiles[0];
				e.preventDefault();
				target.focus({ preventScroll: true });
				activate(target.dataset.tileId || "", Number(target.dataset.col), target);
				return;
			}

			const currentCol = Number(currentTile.dataset.col);
			const colTiles = allTiles.filter((t) => Number(t.dataset.col) === currentCol);

			// Measure visual on-screen positions
			const tilePositions = colTiles
				.map((el) => ({ el, rect: el.getBoundingClientRect() }))
				.sort((a, b) => a.rect.top - b.rect.top);

			const currentIndex = tilePositions.findIndex((t) => t.el === currentTile);
			const visibleTiles = tilePositions.filter(
				(t) => t.rect.bottom > containerRect.top && t.rect.top < containerRect.bottom,
			);

			let nextTile: HTMLElement | null = null;

			if (key === "ArrowDown") {
				// If currently on or near the bottom visible boundary, wrap to top to reappear from top
				const isAtBottomEdge =
					currentIndex >= tilePositions.length - 1 ||
					(visibleTiles.length > 0 && currentTile === visibleTiles[visibleTiles.length - 1].el) ||
					tilePositions[currentIndex]?.rect.bottom >= containerRect.bottom - 60;

				if (isAtBottomEdge) {
					// Wrap to the top-most visible or entering tile in the column
					const topTarget = visibleTiles[0] || tilePositions[0];
					nextTile = topTarget.el;

					// Smoothly ensure the top tile is framed cleanly at the top of the viewport
					const meta = columnMeta[currentCol];
					if (meta && trackRefs.current[currentCol]) {
						const currentOffset = offsetsRef.current[currentCol] ?? 0;
						const rect = nextTile.getBoundingClientRect();
						if (rect.top < containerRect.top + 20) {
							const diff = containerRect.top + 30 - rect.top;
							offsetsRef.current[currentCol] =
								(((currentOffset - diff) % meta.copyHeight) + meta.copyHeight) % meta.copyHeight;
						}
					}
				} else if (currentIndex !== -1 && currentIndex + 1 < tilePositions.length) {
					nextTile = tilePositions[currentIndex + 1].el;
				} else {
					nextTile = visibleTiles[0]?.el || tilePositions[0]?.el;
				}
			} else if (key === "ArrowUp") {
				// If currently on or near top visible boundary, wrap to bottom to reappear from bottom
				const isAtTopEdge =
					currentIndex <= 0 ||
					(visibleTiles.length > 0 && currentTile === visibleTiles[0].el) ||
					tilePositions[currentIndex]?.rect.top <= containerRect.top + 60;

				if (isAtTopEdge) {
					// Wrap to bottom-most visible tile
					const bottomTarget =
						visibleTiles[visibleTiles.length - 1] || tilePositions[tilePositions.length - 1];
					nextTile = bottomTarget.el;
				} else if (currentIndex > 0) {
					nextTile = tilePositions[currentIndex - 1].el;
				} else {
					nextTile =
						visibleTiles[visibleTiles.length - 1]?.el ||
						tilePositions[tilePositions.length - 1]?.el;
				}
			} else if (key === "Home") {
				nextTile = visibleTiles[0]?.el || tilePositions[0]?.el;
			} else if (key === "End") {
				nextTile =
					visibleTiles[visibleTiles.length - 1]?.el || tilePositions[tilePositions.length - 1]?.el;
			} else if (key === "ArrowRight") {
				const allCols = Array.from(new Set(allTiles.map((t) => Number(t.dataset.col)))).sort(
					(a, b) => a - b,
				);
				const colIdx = allCols.indexOf(currentCol);
				const nextColNum = allCols[(colIdx + 1) % allCols.length];
				const nextColTiles = allTiles
					.filter((t) => Number(t.dataset.col) === nextColNum)
					.map((el) => ({ el, rect: el.getBoundingClientRect() }));

				const currentCenterY = currentTile.getBoundingClientRect().top;
				let closest = nextColTiles[0];
				let minDiff = Infinity;
				for (const item of nextColTiles) {
					const diff = Math.abs(item.rect.top - currentCenterY);
					if (diff < minDiff) {
						minDiff = diff;
						closest = item;
					}
				}
				nextTile = closest?.el || null;
			} else if (key === "ArrowLeft") {
				const allCols = Array.from(new Set(allTiles.map((t) => Number(t.dataset.col)))).sort(
					(a, b) => a - b,
				);
				const colIdx = allCols.indexOf(currentCol);
				const prevColNum = allCols[(colIdx - 1 + allCols.length) % allCols.length];
				const prevColTiles = allTiles
					.filter((t) => Number(t.dataset.col) === prevColNum)
					.map((el) => ({ el, rect: el.getBoundingClientRect() }));

				const currentCenterY = currentTile.getBoundingClientRect().top;
				let closest = prevColTiles[0];
				let minDiff = Infinity;
				for (const item of prevColTiles) {
					const diff = Math.abs(item.rect.top - currentCenterY);
					if (diff < minDiff) {
						minDiff = diff;
						closest = item;
					}
				}
				nextTile = closest?.el || null;
			}

			if (nextTile) {
				e.preventDefault();
				nextTile.focus({ preventScroll: true });
				activate(nextTile.dataset.tileId || "", Number(nextTile.dataset.col), nextTile);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [activate, columnMeta]);

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

	const itemIndexMap = useMemo(() => {
		const map = new Map<DriftWallItem, number>();
		for (let i = 0; i < items.length; i++) {
			map.set(items[i], i);
		}
		return map;
	}, [items]);

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

	const handleTileClickDelegated = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			const target = e.target as HTMLElement | null;
			const tile =
				target && typeof target.closest === "function"
					? (target.closest("[data-tile-id]") as HTMLElement | null)
					: null;
			if (!tile) {
				return;
			}
			const originalIndex = Number(tile.dataset.originalIndex);
			const item = items[originalIndex];
			if (item) {
				handleTileClick(item, originalIndex);
			}
		},
		[items, handleTileClick],
	);

	const handleFocusCapture = useCallback(
		(e: React.FocusEvent<HTMLDivElement>) => {
			const target = e.target as HTMLElement | null;
			const tile =
				target && typeof target.closest === "function"
					? (target.closest("[data-tile-id]") as HTMLElement | null)
					: null;
			if (tile?.dataset.tileId) {
				activate(tile.dataset.tileId, Number(tile.dataset.col), tile);
			}
		},
		[activate],
	);

	const handleBlurCapture = useCallback(
		(e: React.FocusEvent<HTMLDivElement>) => {
			if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
				release();
			}
		},
		[release],
	);

	const rootClass = ["drift-wall", reduced ? "drift-wall--reduced" : "", className]
		.filter(Boolean)
		.join(" ");

	return (
		<div
			ref={containerRef}
			className={rootClass}
			style={cssVars}
			onClick={handleTileClickDelegated}
			onFocusCapture={handleFocusCapture}
			onBlurCapture={handleBlurCapture}
			onPointerMove={handlePointerMove}
			onWheel={handleWheel}
			onPointerEnter={handlePointerEnter}
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
					return (
						<div className="drift-wall__col" key={`col-${c}`}>
							<div
								className="drift-wall__track"
								ref={(el) => {
									trackRefs.current[c] = el;
								}}
							>
								{meta.copyIndices.map((copyIndex) =>
									col.map((item, itemIndex) => {
										const tileId = `${c}-${copyIndex}-${itemIndex}`;
										const originalIndex = itemIndexMap.get(item) ?? itemIndex;
										return (
											<DriftWallTile
												key={tileId}
												tileId={tileId}
												col={c}
												width={effectiveTileWidth}
												height={effectiveTileHeight}
												name={item.title || item.name || "tile"}
												orbitText={item.subtitle || item.orbitText || ""}
												isSelected={Boolean(item.selected)}
												image={item.image}
												href={item.href}
												locked={item.locked}
												originalIndex={originalIndex}
												itemIndex={itemIndex}
												copyIndex={copyIndex}
												reduced={reduced}
												displace={item.displace ?? displace}
												distortionScale={item.distortionScale ?? distortionScale}
												redOffset={item.redOffset ?? redOffset}
												greenOffset={item.greenOffset ?? greenOffset}
												blueOffset={item.blueOffset ?? blueOffset}
												brightness={item.brightness ?? brightness}
												opacity={item.opacity ?? opacity}
												blur={item.blur ?? blur}
												borderWidth={item.borderWidth ?? borderWidth}
												mixBlendMode={item.mixBlendMode ?? mixBlendMode}
											/>
										);
									}),
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};
