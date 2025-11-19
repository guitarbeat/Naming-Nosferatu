/**
 * @module performanceMonitor
 * @description Performance monitoring class for tracking application metrics.
 */

/**
 * * Performance monitoring class
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      bundleSize: {},
      loadTimes: {},
      runtimeMetrics: {},
      memoryUsage: {},
    };
    this.observers = [];
  }

  /**
   * * Track bundle size metrics (async)
   */
  async trackBundleSize() {
    if (typeof window === "undefined") return;

    // * In development mode, use Vite's module analysis
    if (process.env.NODE_ENV === "development") {
      this.metrics.bundleSize = {
        javascript: this.estimateDevBundleSize(),
        css: this.estimateDevCSSSize(),
        total: this.estimateDevBundleSize() + this.estimateDevCSSSize(),
        timestamp: Date.now(),
        mode: "development-estimate",
      };
      if (process.env.NODE_ENV === "development") {
        console.log(
          "📊 Bundle Size Metrics (Dev Estimate):",
          this.metrics.bundleSize,
        );
      }
      return;
    }

    // * Use requestIdleCallback to avoid blocking the main thread
    if ("requestIdleCallback" in window) {
      requestIdleCallback(async () => {
        await this.calculateBundleSize();
      });
    } else {
      // * Fallback for browsers without requestIdleCallback
      setTimeout(async () => {
        await this.calculateBundleSize();
      }, 0);
    }
  }

  /**
   * * Calculate bundle size (separated for better performance)
   */
  async calculateBundleSize() {
    const scripts = Array.from(document.querySelectorAll("script[src]"));
    const stylesheets = Array.from(
      document.querySelectorAll('link[rel="stylesheet"]'),
    );

    let totalJS = 0;
    let totalCSS = 0;

    try {
      // * Process scripts asynchronously with batching to prevent blocking
      const scriptSizes = await Promise.all(
        scripts.map((script) => this.getResourceSize(script.src)),
      );
      totalJS = scriptSizes.reduce((sum, size) => sum + (size || 0), 0);

      // * Process stylesheets asynchronously with batching
      const stylesheetSizes = await Promise.all(
        stylesheets.map((link) => this.getResourceSize(link.href)),
      );
      totalCSS = stylesheetSizes.reduce((sum, size) => sum + (size || 0), 0);
    } catch (error) {
      console.warn("⚠️ Error calculating bundle size:", error);
      // * Fallback to 0 if calculation fails
      totalJS = 0;
      totalCSS = 0;
    }

    this.metrics.bundleSize = {
      javascript: totalJS,
      css: totalCSS,
      total: totalJS + totalCSS,
      timestamp: Date.now(),
      mode: "production",
    };

    if (process.env.NODE_ENV === "development") {
      console.log("📊 Bundle Size Metrics:", this.metrics.bundleSize);
    }
  }

  /**
   * * Track page load times
   */
  trackLoadTimes() {
    if (typeof window === "undefined") return;

    // * Use a more robust approach for load time tracking
    const trackLoadMetrics = () => {
      // * Use requestAnimationFrame to avoid forced reflows
      requestAnimationFrame(() => {
        const [navigation] = performance.getEntriesByType("navigation");

        if (!navigation) {
          console.warn("⚠️ Navigation timing not available");
          return;
        }

        // * Calculate safe timing values with proper fallbacks
        const domContentLoaded = Math.max(
          0,
          navigation.domContentLoadedEventEnd -
            navigation.domContentLoadedEventStart,
        );
        const loadComplete = Math.max(
          0,
          navigation.loadEventEnd - navigation.loadEventStart,
        );
        const totalLoadTime = Math.max(
          0,
          navigation.loadEventEnd - navigation.fetchStart,
        );

        this.metrics.loadTimes = {
          domContentLoaded,
          loadComplete,
          totalLoadTime,
          firstPaint: this.getFirstPaint(),
          firstContentfulPaint: this.getFirstContentfulPaint(),
          timestamp: Date.now(),
        };

        if (process.env.NODE_ENV === "development") {
          console.log("⏱️ Load Time Metrics:", this.metrics.loadTimes);
        }
      });
    };

    // * Track immediately if already loaded, otherwise wait for load event
    if (document.readyState === "complete") {
      trackLoadMetrics();
    } else {
      window.addEventListener("load", trackLoadMetrics, { once: true });
    }
  }

  /**
   * * Track runtime performance
   */
  trackRuntimePerformance() {
    if (typeof window === "undefined") return;

    // Track memory usage
    if (performance.memory) {
      this.metrics.memoryUsage = {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        timestamp: Date.now(),
      };
    }

    // * Long task tracking disabled to reduce console noise
    // * Uncomment the block below to enable long task monitoring
    /*
    if ('PerformanceObserver' in window) {
      // Throttle long task logs to avoid console spam during HMR/initial load
      let lastLogTs = 0;
      const minIntervalMs = 1000; // log at most once per second
      const observer = new PerformanceObserver((list) => {
        const now = performance.now();
        let worst = null;
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            if (!worst || entry.duration > worst.duration) worst = entry;
          }
        }
        if (worst && (now - lastLogTs) >= minIntervalMs) {
          lastLogTs = now;
          console.warn('🐌 Long Task Detected:', {
            duration: Math.round(worst.duration),
            startTime: Math.round(worst.startTime),
            name: worst.name
          });
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    }
    */
  }

  /**
   * * Track image loading metrics
   * @param {Object} metrics - Image loading metrics
   * @param {number} metrics.loadedCount - Number of successfully loaded images
   * @param {number} metrics.failedCount - Number of failed image loads
   * @param {number} metrics.totalImages - Total number of images
   */
  trackImageLoadMetrics({ loadedCount, failedCount, totalImages }) {
    const successRate = totalImages > 0 ? (loadedCount / totalImages) * 100 : 0;

    this.metrics.imageLoading = {
      loadedCount,
      failedCount,
      totalImages,
      successRate: Math.round(successRate * 100) / 100,
      timestamp: Date.now(),
    };

    if (process.env.NODE_ENV === "development") {
      console.log("🖼️ Image Loading Metrics:", {
        loaded: loadedCount,
        failed: failedCount,
        total: totalImages,
        successRate: `${successRate.toFixed(1)}%`,
      });
    }

    // * Warn if success rate is low
    if (successRate < 80 && totalImages > 0) {
      console.warn(
        "⚠️ Low image loading success rate:",
        `${successRate.toFixed(1)}%`,
      );
    }
  }

  /**
   * * Get resource size from URL (async)
   * @param {string} url - Resource URL
   * @returns {Promise<number>} Resource size in bytes
   */
  async getResourceSize(url) {
    try {
      const response = await fetch(url, { method: "HEAD" });
      const contentLength = response.headers.get("Content-Length");
      return parseInt(contentLength || "0");
    } catch {
      return 0;
    }
  }

  /**
   * * Get First Paint time
   * @returns {number} First paint time in milliseconds
   */
  getFirstPaint() {
    const paintEntries = performance.getEntriesByType("paint");
    const firstPaint = paintEntries.find(
      (entry) => entry.name === "first-paint",
    );
    return firstPaint ? firstPaint.startTime : 0;
  }

  /**
   * * Get First Contentful Paint time
   * @returns {number} First contentful paint time in milliseconds
   */
  getFirstContentfulPaint() {
    const paintEntries = performance.getEntriesByType("paint");
    const firstContentfulPaint = paintEntries.find(
      (entry) => entry.name === "first-contentful-paint",
    );
    return firstContentfulPaint ? firstContentfulPaint.startTime : 0;
  }

  /**
   * * Estimate bundle size in development mode
   * @returns {number} Estimated JavaScript bundle size in bytes
   */
  estimateDevBundleSize() {
    // * Rough estimation based on typical React app sizes
    // * This is a conservative estimate for development mode
    const baseSize = 500000; // 500KB base
    const componentOverhead = 200000; // 200KB for components
    const devOverhead = 300000; // 300KB for dev tools and HMR

    return baseSize + componentOverhead + devOverhead;
  }

  /**
   * * Estimate CSS size in development mode
   * @returns {number} Estimated CSS bundle size in bytes
   */
  estimateDevCSSSize() {
    // * Rough estimation for CSS modules and styles
    const baseCSS = 50000; // 50KB base CSS
    const moduleCSS = 30000; // 30KB for CSS modules
    const devCSS = 20000; // 20KB for dev styles

    return baseCSS + moduleCSS + devCSS;
  }

  /**
   * * Get all metrics
   * @returns {Object} All performance metrics
   */
  getAllMetrics() {
    return {
      ...this.metrics,
      userAgent: navigator.userAgent,
      connection: navigator.connection
        ? {
            effectiveType: navigator.connection.effectiveType,
            downlink: navigator.connection.downlink,
            rtt: navigator.connection.rtt,
          }
        : null,
    };
  }

  /**
   * * Clean up observers
   */
  cleanup() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }

  /**
   * * Initialize all monitoring
   */
  init() {
    // * Use requestIdleCallback to defer initialization and avoid blocking
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => {
        this.initializeMonitoring();
      });
    } else {
      // * Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        this.initializeMonitoring();
      }, 100);
    }
  }

  /**
   * * Initialize monitoring (separated for better performance)
   */
  initializeMonitoring() {
    // * Run bundle size calculation in background to avoid blocking
    this.trackBundleSize().catch((error) => {
      console.warn("Bundle size calculation failed:", error);
    });
    this.trackLoadTimes();
    this.trackRuntimePerformance();

    // * In development, reduce monitoring frequency to improve performance
    if (process.env.NODE_ENV === "development") {
      console.log("🚀 Performance monitoring initialized (development mode)");
    }
  }
}

// * Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// * Auto-initialize in development
if (process.env.NODE_ENV === "development") {
  performanceMonitor.init();
}

export { performanceMonitor };
