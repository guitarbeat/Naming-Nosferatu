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
	brightness?: number;
	opacity?: number;
	blur?: number;
	borderWidth?: number;
	borderRadius?: number;
	onClick?: () => void;
	[key: string]: unknown;
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
	onItemClick?: (item: DriftWallItem, index: number) => void;
	[key: string]: unknown;
}

export const DriftWall = memo(function DriftWall({
	items = [],
	columns = 7,
	tileWidth = 148,
	tileHeight = 148,
	gap = 20,
	radius = 9999,
	tilt = 0,
	turn = 0,
	roll = 0,
	perspective = 1200,
	depth = 120,
	speed = 22,
	direction = "up",
	variance = 0.45,
	parallax = 0.55,
	pauseOnHover = true,
	lift = 0,
	fade = 0,
	dim = 1,
	grayscale = false,
	overlayColor = "#060010",
	brightness = 60,
	opacity = 0.85,
	blur = 11,
	borderWidth = 0.16,
	className = "",
	style,
	onItemClick,
}: DriftWallProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const planeRef = useRef<HTMLDivElement>(null);
	const trackRefs = useRef<(HTMLDivElement | null)[]>([]);
	const rafRef = useRef<number | null>(null);
	const offsetsRef = useRef<number[]>([]);
	const velocitiesRef = useRef<number[]>([]);
	const wheelDeltaRef = useRef(0);
	const wheelVelocityRef = useRef(0);
	const hoveredColRef = useRef<number>(-1);
	const wallHoveredRef = useRef(false);
	const pointerRef = useRef({ x: 0, y: 0 });
	const pointerDampedRef = useRef({ x: 0, y: 0 });
	const lastTsRef = useRef<number | null>(null);
	const activeIdRef = useRef<string | null>(null);
	const activeTileElRef = useRef<HTMLElement | null>(null);

	const [dims, setDims] = useState({ w: 1200, h: 600 });
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
		const ro = new ResizeObserver(([entry]) => {
			if (entry?.contentRect) {
				const nextW = Math.round(entry.contentRect.width) || 1200;
				const nextH = Math.round(entry.contentRect.height) || 600;
				setDims((prev) => (prev.w === nextW && prev.h === nextH ? prev : { w: nextW, h: nextH }));
			}
		});
		ro.observe(containerRef.current);
		return () => ro.disconnect();
	}, []);

	const isMobile = dims.w > 0 && dims.w < 640;
	const effW = isMobile ? Math.min(tileWidth, 108) : tileWidth;
	const effH = isMobile ? Math.min(tileHeight, 108) : tileHeight;

	const effectiveColumns = useMemo(() => {
		const fitting = Math.max(
			isMobile ? 2 : 4,
			Math.ceil((dims.w + gap) / (effW + gap)) + (isMobile ? 0 : 1),
		);
		return columns
			? isMobile && dims.w < 480
				? Math.min(columns, 3)
				: Math.max(columns, fitting)
			: fitting;
	}, [dims.w, effW, gap, columns, isMobile]);

	const columnItems = useMemo(() => {
		if (!items.length) {
			return Array.from({ length: effectiveColumns }, () => []);
		}
		const cols: DriftWallItem[][] = Array.from({ length: effectiveColumns }, () => []);
		for (let i = 0; i < items.length; i++) {
			cols[i % effectiveColumns].push(items[i]);
		}
		for (let c = 0; c < effectiveColumns; c++) {
			if (cols[c].length === 0) {
				cols[c].push(items[c % items.length]);
			}
		}
		return cols;
	}, [items, effectiveColumns]);

	const columnMeta = useMemo(() => {
		const unit = effH + gap;
		return columnItems.map((col) => {
			const copyHeight = Math.max(1, col.length) * unit;
			const copies = Math.max(
				isMobile ? 2 : 3,
				Math.ceil((dims.h * (isMobile ? 1.4 : 2.1)) / copyHeight) + 1,
			);
			return { copyHeight, copyIndices: Array.from({ length: copies }, (_, i) => i) };
		});
	}, [columnItems, effH, gap, dims.h, isMobile]);

	const baseVelocities = useMemo(() => {
		const dirSign = direction === "up" ? 1 : -1;
		return columnItems.map((_, c) => {
			const pseudo = ((c * 0.6180339887 + 0.35) % 1) * 2 - 1;
			return speed * (1 + variance * pseudo) * dirSign * (c % 2 === 0 ? 1 : -1);
		});
	}, [columnItems, speed, direction, variance]);

	useEffect(() => {
		offsetsRef.current = columnMeta.map((meta, c) => {
			const cur = offsetsRef.current[c];
			return typeof cur === "number" && !Number.isNaN(cur)
				? ((cur % meta.copyHeight) + meta.copyHeight) % meta.copyHeight
				: (meta.copyHeight * (c * 0.382)) % meta.copyHeight;
		});
		velocitiesRef.current = columnItems.map((_, c) => velocitiesRef.current[c] ?? 0);
	}, [columnMeta, columnItems]);

	useEffect(() => {
		const animate = (ts: number) => {
			if (document.hidden) {
				rafRef.current = null;
				lastTsRef.current = null;
				return;
			}
			if (lastTsRef.current === null) {
				lastTsRef.current = ts;
			}
			const dt = Math.min(0.05, Math.max(0, ts - lastTsRef.current) / 1000);
			lastTsRef.current = ts;

			const maxTilt = parallax * 8;
			const damp = 1 - Math.exp(-dt / 0.12);
			pointerDampedRef.current.x +=
				(pointerRef.current.x * maxTilt - pointerDampedRef.current.x) * damp;
			pointerDampedRef.current.y +=
				(-pointerRef.current.y * maxTilt - pointerDampedRef.current.y) * damp;
			if (planeRef.current) {
				const px = reduced ? 0 : pointerDampedRef.current.x;
				const py = reduced ? 0 : pointerDampedRef.current.y;
				planeRef.current.style.transform = `translate(-50%, -50%) scale(0.95) rotateX(${tilt + py}deg) rotateY(${turn + px}deg) rotateZ(${roll}deg) translateZ(${-depth}px)`;
			}

			if (wheelDeltaRef.current !== 0) {
				wheelVelocityRef.current += wheelDeltaRef.current * 0.9;
				wheelDeltaRef.current = 0;
			}
			const wheelImpulse = wheelVelocityRef.current;
			wheelVelocityRef.current =
				Math.abs(wheelImpulse) > 0.05 ? wheelImpulse * Math.exp(-dt / 0.18) : 0;

			for (let c = 0; c < trackRefs.current.length; c++) {
				const meta = columnMeta[c];
				const el = trackRefs.current[c];
				if (!meta || !el) {
					continue;
				}
				let factor = reduced ? 0 : 1;
				if (!reduced && pauseOnHover) {
					if (hoveredColRef.current === c) {
						factor = 0;
					} else if (activeIdRef.current !== null || hoveredColRef.current !== -1) {
						factor = 0.2;
					} else if (wallHoveredRef.current) {
						factor = 0.45;
					}
				}
				const target = (baseVelocities[c] ?? 0) * factor;
				const ease = 1 - Math.exp(-dt / (target === 0 ? 0.16 : 0.28));
				const nextVel =
					(velocitiesRef.current[c] ?? 0) + (target - (velocitiesRef.current[c] ?? 0)) * ease;
				velocitiesRef.current[c] = nextVel;

				const colDir = c % 2 === 0 ? 1 : -1;
				let next = (offsetsRef.current[c] ?? 0) + nextVel * dt + wheelImpulse * dt * 0.45 * colDir;
				next = ((next % meta.copyHeight) + meta.copyHeight) % meta.copyHeight;
				offsetsRef.current[c] = next;
				el.style.transform = `translate3d(0, ${-next}px, 0)`;
			}
			rafRef.current = requestAnimationFrame(animate);
		};
		rafRef.current = requestAnimationFrame(animate);
		return () => {
			if (rafRef.current !== null) {
				cancelAnimationFrame(rafRef.current);
			}
		};
	}, [baseVelocities, columnMeta, pauseOnHover, parallax, reduced, tilt, turn, roll, depth]);

	const release = useCallback(() => {
		activeIdRef.current = null;
		hoveredColRef.current = -1;
		activeTileElRef.current?.classList.remove("is-active");
		activeTileElRef.current = null;
	}, []);

	const handlePointerMove = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			const rect = e.currentTarget.getBoundingClientRect();
			if (parallax > 0 && !reduced && rect.width > 0 && rect.height > 0) {
				pointerRef.current = {
					x: (e.clientX - rect.left) / rect.width - 0.5,
					y: (e.clientY - rect.top) / rect.height - 0.5,
				};
			}
			const tile = (e.target as HTMLElement | null)?.closest?.(
				"[data-tile-id]",
			) as HTMLElement | null;
			if (!tile) {
				release();
				return;
			}
			const id = tile.dataset.tileId;
			if (id && id !== activeIdRef.current) {
				activeIdRef.current = id;
				hoveredColRef.current = Number(tile.dataset.col);
				activeTileElRef.current?.classList.remove("is-active");
				tile.classList.add("is-active");
				activeTileElRef.current = tile;
			}
		},
		[parallax, reduced, release],
	);

	const itemIndexMap = useMemo(() => {
		const map = new Map<DriftWallItem, number>();
		for (let idx = 0; idx < items.length; idx++) {
			map.set(items[idx], idx);
		}
		return map;
	}, [items]);

	const handleClickDelegated = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			const tile = (e.target as HTMLElement | null)?.closest?.(
				"[data-tile-id]",
			) as HTMLElement | null;
			if (!tile) {
				return;
			}
			const idx = Number(tile.dataset.originalIndex);
			const item = items[idx];
			if (item) {
				item.onClick?.();
				onItemClick?.(item, idx);
			}
		},
		[items, onItemClick],
	);

	const cssVars: CSSProperties = {
		"--dw-tile-w": `${effW}px`,
		"--dw-tile-h": `${effH}px`,
		"--dw-gap": `${gap}px`,
		"--dw-radius": typeof radius === "number" ? `${radius}px` : radius,
		"--dw-perspective": `${perspective}px`,
		"--dw-lift": `${lift}px`,
		"--dw-dim": dim,
		"--dw-gray": grayscale ? 1 : 0,
		"--dw-overlay": overlayColor,
		"--dw-edge": `${Math.max(0, (1 - fade) * 100)}%`,
		...style,
	} as CSSProperties;

	return (
		<div
			ref={containerRef}
			className={`drift-wall ${reduced ? "drift-wall--reduced" : ""} ${className}`}
			style={cssVars}
			onClick={handleClickDelegated}
			onPointerMove={handlePointerMove}
			onWheel={(e) => {
				wheelDeltaRef.current += e.deltaY;
			}}
			onPointerEnter={() => {
				wallHoveredRef.current = true;
			}}
			onPointerLeave={() => {
				wallHoveredRef.current = false;
				pointerRef.current = { x: 0, y: 0 };
				release();
			}}
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
									col.map((item, itemIndex) => (
										<DriftWallTile
											key={`${c}-${copyIndex}-${itemIndex}`}
											tileId={`${c}-${copyIndex}-${itemIndex}`}
											col={c}
											width={effW}
											height={effH}
											name={item.title || item.name || "tile"}
											orbitText={item.subtitle || item.orbitText || ""}
											isSelected={Boolean(item.selected)}
											image={item.image}
											href={item.href}
											originalIndex={itemIndexMap.get(item) ?? itemIndex}
											brightness={item.brightness ?? brightness}
											opacity={item.opacity ?? opacity}
											blur={item.blur ?? blur}
											borderWidth={item.borderWidth ?? borderWidth}
										/>
									)),
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
});
