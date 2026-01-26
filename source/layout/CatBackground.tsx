import { useCallback, useEffect, useRef } from "react";

/**
 * Star generation constants - using design system values
 * These map to responsive design token considerations
 */
const DEFAULT_STAR_COUNT = 120;
const MOBILE_STAR_REDUCTION = 0.4; /* * Reduce star count by 40% on mobile for performance */
const MOBILE_MAX_WIDTH = 600; /* * Mobile breakpoint threshold */
const STAR_GLYPH = "✦";

/**
 * Twinkle animation parameters (referenced via CSS custom properties)
 * Maps to design token animation durations: --duration-normal (250ms), --duration-slow (350ms), --duration-slower (500ms)
 */
const TWINKLE_DURATION_MIN = 2.6; /* * Faster twinkle in seconds */
const TWINKLE_DURATION_MAX = 4.8; /* * Slower twinkle, aligns with animation tokens */
const TWINKLE_DELAY_MIN = -4; /* * Allow negative delay for staggered starts */
const TWINKLE_DELAY_MAX = 0;
const TWINKLE_SCALE_MIN = 0.9; /* * Subtle scale variation */
const TWINKLE_SCALE_MAX = 1.8;
const TWINKLE_ALPHA_MIN = 0.45; /* * Opacity variation */
const TWINKLE_ALPHA_MAX = 0.95;
const TWINKLE_BLUR_MIN = 0; /* * No blur to slight blur */
const TWINKLE_BLUR_MAX = 1.2;

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;

export default function CatBackground() {
	const skyRef = useRef<HTMLDivElement>(null);
	const idleCallbackRef = useRef<number | null>(null);

	const generateStars = useCallback((skyElement: HTMLElement) => {
		const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		if (prefersReducedMotion) {
			skyElement.innerHTML = "";
			return;
		}

		let starCount = Number.parseInt(skyElement.dataset.stars ?? `${DEFAULT_STAR_COUNT}`, 10);

		if (Number.isNaN(starCount)) {
			starCount = DEFAULT_STAR_COUNT;
		}

		if (window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`).matches) {
			starCount = Math.round(starCount * MOBILE_STAR_REDUCTION);
		}

		skyElement.innerHTML = "";

		const fragment = document.createDocumentFragment();

		for (let i = 0; i < starCount; i += 1) {
			const el = document.createElement("div");
			el.className = "cat-background__star";
			el.textContent = STAR_GLYPH;
			el.style.left = `${Math.random() * 100}vw`;
			el.style.top = `${Math.random() * 100}vh`;

			const size = randomBetween(6, 16);
			el.style.fontSize = `${size.toFixed(2)}px`;
			el.style.setProperty(
				"--twinkle-duration",
				`${randomBetween(TWINKLE_DURATION_MIN, TWINKLE_DURATION_MAX).toFixed(2)}s`,
			);
			el.style.setProperty(
				"--twinkle-delay",
				`${randomBetween(TWINKLE_DELAY_MIN, TWINKLE_DELAY_MAX).toFixed(2)}s`,
			);
			el.style.setProperty(
				"--twinkle-scale",
				`${randomBetween(TWINKLE_SCALE_MIN, TWINKLE_SCALE_MAX).toFixed(2)}`,
			);
			el.style.setProperty(
				"--twinkle-alpha",
				`${randomBetween(TWINKLE_ALPHA_MIN, TWINKLE_ALPHA_MAX).toFixed(2)}`,
			);
			el.style.setProperty(
				"--twinkle-blur",
				`${randomBetween(TWINKLE_BLUR_MIN, TWINKLE_BLUR_MAX).toFixed(2)}px`,
			);

			fragment.appendChild(el);
		}

		skyElement.appendChild(fragment);
	}, []);

	useEffect(() => {
		const skyElement = skyRef.current;
		if (!skyElement) {
			return undefined;
		}

		if (typeof window !== "undefined" && "requestIdleCallback" in window) {
			idleCallbackRef.current = window.requestIdleCallback(() => {
				generateStars(skyElement);
			});
		} else {
			generateStars(skyElement);
		}

		return () => {
			if (idleCallbackRef.current) {
				window.cancelIdleCallback(idleCallbackRef.current);
			}
			skyElement.innerHTML = "";
		};
	}, [generateStars]);

	return (
		<div className="cat-background" aria-hidden="true">
			<div className="cat-background__gradient" />
			<div id="sky" ref={skyRef} data-stars={DEFAULT_STAR_COUNT} className="cat-background__sky" />
		</div>
	);
}
