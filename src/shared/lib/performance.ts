/**
 * @module performance
 * @description Development-only performance monitoring using standard Web Vitals APIs.
 *
 * Tracks FCP, LCP, CLS, FID, and navigation timing. All observers are cleaned
 * up via `cleanupPerformanceMonitoring()`. In production builds every function
 * is a no-op, so tree-shaking should eliminate the module entirely.
 *
 * @example
 * // In your app entry point:
 * import { initializePerformanceMonitoring, cleanupPerformanceMonitoring } from "./performance";
 *
 * initializePerformanceMonitoring();
 * // on unmount / HMR:
 * cleanupPerformanceMonitoring();
 */

const isDev = import.meta.env?.DEV ?? false;

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

interface PerformanceMetrics {
	fcp?: number;
	lcp?: number;
	fid?: number;
	cls?: number;
	domContentLoaded?: number;
	loadComplete?: number;
	serverResponseTime?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════════════════════════════════════

const metrics: PerformanceMetrics = {};
const observers: PerformanceObserver[] = [];

// ═══════════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Report navigation timing using the Navigation Timing Level 2 API.
 * (The legacy `performance.timing` property is deprecated.)
 */
function reportNavigationMetrics(): void {
	const entries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
	const nav = entries[0];
	if (!nav) {
		return;
	}

	metrics.domContentLoaded = Math.round(nav.domContentLoadedEventEnd);
	metrics.loadComplete = Math.round(nav.loadEventEnd);
	metrics.serverResponseTime = Math.round(nav.responseEnd - nav.requestStart);

	console.debug(`[Perf] DOM Content Loaded: ${metrics.domContentLoaded}ms`);
	console.debug(`[Perf] Page Load Complete: ${metrics.loadComplete}ms`);
	console.debug(`[Perf] Server Response: ${metrics.serverResponseTime}ms`);
}

/**
 * Safely create and register a `PerformanceObserver` for a single entry type.
 * Returns silently if the entry type isn't supported in the current browser.
 */
function observeWebVital(type: string, callback: (entries: PerformanceEntryList) => void): void {
	try {
		const observer = new PerformanceObserver((list) => callback(list.getEntries()));
		observer.observe({ type, buffered: true });
		observers.push(observer);
	} catch {
		console.debug(`[Perf] "${type}" observer not supported`);
	}
}

// ═══════════════════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════════════════

/** Start collecting Web Vitals and navigation metrics (dev only). */
export function initializePerformanceMonitoring(): void {
	if (!isDev || typeof window === "undefined") {
		return;
	}

	// Navigation timing (after full page load)
	window.addEventListener("load", () => setTimeout(reportNavigationMetrics, 0), { once: true });

	if (!("PerformanceObserver" in window)) {
		return;
	}

	// First Contentful Paint
	observeWebVital("paint", (entries) => {
		const fcp = entries.find((e) => e.name === "first-contentful-paint");
		if (fcp) {
			metrics.fcp = Math.round(fcp.startTime);
			console.debug(`[Perf] FCP: ${metrics.fcp}ms`);
		}
	});

	// Largest Contentful Paint
	observeWebVital("largest-contentful-paint", (entries) => {
		const last = entries[entries.length - 1] as
			| (PerformanceEntry & { renderTime?: number; loadTime?: number })
			| undefined;
		if (last) {
			metrics.lcp = Math.round(last.renderTime || last.loadTime || last.startTime);
			console.debug(`[Perf] LCP: ${metrics.lcp}ms`);
		}
	});

	// Cumulative Layout Shift
	let clsTotal = 0;
	observeWebVital("layout-shift", (entries) => {
		for (const entry of entries as (PerformanceEntry & {
			hadRecentInput: boolean;
			value: number;
		})[]) {
			if (!entry.hadRecentInput) {
				clsTotal += entry.value;
				metrics.cls = parseFloat(clsTotal.toFixed(4));
			}
		}
		console.debug(`[Perf] CLS: ${metrics.cls}`);
	});

	// First Input Delay
	observeWebVital("first-input", (entries) => {
		const entry = entries[0] as (PerformanceEntry & { processingStart: number }) | undefined;
		if (entry) {
			metrics.fid = Math.round(entry.processingStart - entry.startTime);
			console.debug(`[Perf] FID: ${metrics.fid}ms`);
		}
	});
}

/** Disconnect all registered observers. Safe to call multiple times. */
export function cleanupPerformanceMonitoring(): void {
	for (const observer of observers) {
		try {
			observer.disconnect();
		} catch {
			/* already disconnected */
		}
	}
	observers.length = 0;
}

/** Retrieve a snapshot of all collected metrics. */
export function getPerformanceMetrics(): Readonly<PerformanceMetrics> {
	return { ...metrics };
}
