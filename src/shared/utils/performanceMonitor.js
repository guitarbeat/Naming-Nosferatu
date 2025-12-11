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
  metrics: {},
  observers: [],
};

/**
 * Initialize performance monitoring for Core Web Vitals
 * Monitors FCP, LCP, CLS, FID
 */
export function initializePerformanceMonitoring() {
  if (!isDevelopment || typeof window === "undefined") {
    return;
  }

  // Report Navigation Timing metrics
  if (window.performance && window.performance.timing) {
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
        const lastEntry = entries[entries.length - 1];
        performanceMetrics.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
        console.debug(
          `[Performance] Largest Contentful Paint: ${performanceMetrics.metrics.lcp}ms`
        );
      });
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
      performanceMetrics.observers.push(lcpObserver);
    } catch (error) {
      console.debug("LCP observer not supported");
    }

    // Cumulative Layout Shift
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            performanceMetrics.metrics.cls = clsValue;
            console.debug(`[Performance] Cumulative Layout Shift: ${clsValue.toFixed(3)}`);
          }
        }
      });
      clsObserver.observe({ entryTypes: ["layout-shift"] });
      performanceMetrics.observers.push(clsObserver);
    } catch (error) {
      console.debug("CLS observer not supported");
    }

    // First Input Delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          performanceMetrics.metrics.fid = entry.processingDuration;
          console.debug(
            `[Performance] First Input Delay: ${entry.processingDuration}ms`
          );
        });
      });
      fidObserver.observe({ entryTypes: ["first-input"] });
      performanceMetrics.observers.push(fidObserver);
    } catch (error) {
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
              `[Performance] First Contentful Paint: ${entry.startTime}ms`
            );
          }
        });
      });
      fcpObserver.observe({ entryTypes: ["paint"] });
      performanceMetrics.observers.push(fcpObserver);
    } catch (error) {
      console.debug("FCP observer not supported");
    }
  }
}

/**
 * Report navigation timing metrics
 */
function reportNavigationMetrics() {
  const timing = window.performance?.timing;
  if (!timing) return;

  const navigationStart = timing.navigationStart;
  const domContentLoadedTime = timing.domContentLoadedEventEnd - navigationStart;
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
 * Measure component render time
 * @param {string} componentName - Name of the component
 * @param {Function} callback - Function to measure
 * @returns {*} Result of the callback
 */
export function measureComponentRender(componentName, callback) {
  if (!isDevelopment) {
    return callback();
  }

  const startTime = performance.now();
  const result = callback();
  const endTime = performance.now();
  const duration = endTime - startTime;

  if (duration > 50) {
    console.debug(
      `[Performance] ${componentName} render time: ${duration.toFixed(2)}ms`
    );
  }

  return result;
}

/**
 * Measure async operation
 * @param {string} label - Label for the operation
 * @param {Promise} promise - Promise to measure
 * @returns {Promise} The original promise
 */
export async function measureAsync(label, promise) {
  if (!isDevelopment) {
    return promise;
  }

  const startTime = performance.now();
  try {
    const result = await promise;
    const duration = performance.now() - startTime;
    console.debug(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    console.debug(
      `[Performance] ${label} (failed): ${duration.toFixed(2)}ms`,
      error
    );
    throw error;
  }
}

/**
 * Get all collected metrics
 * @returns {Object} Performance metrics
 */
export function getMetrics() {
  return { ...performanceMetrics.metrics };
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
