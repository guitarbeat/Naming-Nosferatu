/**
 * @module performanceMonitor
 * @description Utility for monitoring application performance metrics
 * Tracks Core Web Vitals and custom performance metrics
 */

const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Performance metrics collector
 */
const performanceMetrics = {
  metrics: {} as Record<string, number>,
  observers: [] as PerformanceObserver[],
};

/**
 * Report navigation timing metrics
 */
function reportNavigationMetrics() {
  const timing = (
    window.performance as unknown as { timing: PerformanceTiming }
  )?.timing;
  if (!timing) return;

  const { navigationStart } = timing;
  const domContentLoadedTime =
    timing.domContentLoadedEventEnd - navigationStart;
  const loadCompleteTime = timing.loadEventEnd - navigationStart;
  const connectTime = timing.responseEnd - timing.requestStart;

  performanceMetrics.metrics.domContentLoaded = domContentLoadedTime;
  performanceMetrics.metrics.loadComplete = loadCompleteTime;
  performanceMetrics.metrics.connect = connectTime;

  console.debug(`[Performance] DOM Content Loaded: ${domContentLoadedTime}ms`);
  console.debug(`[Performance] Page Load Complete: ${loadCompleteTime}ms`);
  console.debug(`[Performance] Server Connect Time: ${connectTime}ms`);
}

/**
 * Initialize performance monitoring for Core Web Vitals
 * Monitors FCP, LCP, CLS, FID
 */
export function initializePerformanceMonitoring() {
  if (!isDevelopment || typeof window === "undefined") {
    return;
  }

  // Report Navigation Timing metrics
  if (
    window.performance &&
    (window.performance as unknown as { timing: PerformanceTiming }).timing
  ) {
    window.addEventListener("load", () => {
      setTimeout(() => {
        reportNavigationMetrics();
      }, 0);
    });
  }

  // Largest Contentful Paint
  if ("PerformanceObserver" in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as unknown as {
          renderTime: number;
          loadTime: number;
        };
        performanceMetrics.metrics.lcp =
          lastEntry.renderTime || lastEntry.loadTime;
        console.debug(
          `[Performance] Largest Contentful Paint: ${performanceMetrics.metrics.lcp}ms`,
        );
      });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
      performanceMetrics.observers.push(lcpObserver);
    } catch (_error) {
      console.debug("LCP observer not supported");
    }

    // Cumulative Layout Shift
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as unknown as {
          hadRecentInput: boolean;
          value: number;
        }[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            performanceMetrics.metrics.cls = clsValue;
            console.debug(
              `[Performance] Cumulative Layout Shift: ${clsValue.toFixed(3)}`,
            );
          }
        }
      });
      clsObserver.observe({ type: "layout-shift", buffered: true });
      performanceMetrics.observers.push(clsObserver);
    } catch (_error) {
      console.debug("CLS observer not supported");
    }

    // First Input Delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: PerformanceEntry) => {
          const eventEntry = entry as unknown as { processingDuration: number };
          performanceMetrics.metrics.fid = eventEntry.processingDuration;
          console.debug(
            `[Performance] First Input Delay: ${eventEntry.processingDuration}ms`,
          );
        });
      });
      fidObserver.observe({ type: "first-input", buffered: true });
      performanceMetrics.observers.push(fidObserver);
    } catch (_error) {
      console.debug("FID observer not supported");
    }

    // First Contentful Paint
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === "first-contentful-paint") {
            performanceMetrics.metrics.fcp = entry.startTime;
            console.debug(
              `[Performance] First Contentful Paint: ${entry.startTime}ms`,
            );
          }
        });
      });
      fcpObserver.observe({ type: "paint", buffered: true });
      performanceMetrics.observers.push(fcpObserver);
    } catch (_error) {
      console.debug("FCP observer not supported");
    }
  }
}

/**
 * Clean up performance observers
 */
export function cleanupPerformanceMonitoring() {
  performanceMetrics.observers.forEach((observer) => {
    try {
      observer.disconnect();
    } catch (error) {
      console.debug("Error disconnecting observer:", error);
    }
  });
  performanceMetrics.observers = [];
}
