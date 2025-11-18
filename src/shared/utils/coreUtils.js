/**
 * @module coreUtils
 * @description Consolidated utility functions for the cat names application.
 * Combines array operations, image handling, tournament logic, and performance monitoring.
 */

// * Array Utilities
/**
 * * Shuffles an array using the Fisher-Yates algorithm
 * @param {Array} array - The array to shuffle
 * @returns {Array} A new shuffled array
 */
export function shuffleArray(array) {
  if (!Array.isArray(array)) {
    console.warn('shuffleArray received non-array input:', array);
    return [];
  }

  const newArray = [...array];
  try {
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in shuffleArray:', error);
    }
    return array;
  }
}

/**
 * * Generate all possible pairs from a list of names
 * @param {Array} nameList - Array of name strings
 * @returns {Array} Array of [name1, name2] pairs
 */
export function generatePairs(nameList) {
  const pairs = [];
  for (let i = 0; i < nameList.length - 1; i++) {
    for (let j = i + 1; j < nameList.length; j++) {
      pairs.push([nameList[i], nameList[j]]);
    }
  }
  return pairs;
}

/**
 * * Build a comparisons map from tournament history
 * @param {Array} history - Array of tournament history entries
 * @returns {Map} Map of name -> comparison count
 */
export function buildComparisonsMap(history) {
  const comparisons = new Map();
  for (const v of history) {
    const l = v?.match?.left?.name;
    const r = v?.match?.right?.name;
    if (l) comparisons.set(l, (comparisons.get(l) || 0) + 1);
    if (r) comparisons.set(r, (comparisons.get(r) || 0) + 1);
  }
  return comparisons;
}

// * Image Utilities
/**
 * * Load a File/Blob into an HTMLImageElement
 * @param {File} file - Image file to load
 * @returns {Promise<HTMLImageElement>} Loaded image element
 */
async function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

/**
 * * Validate if an image URL is accessible
 * @param {string} url - Image URL to validate
 * @returns {Promise<boolean>} True if image is accessible
 */
export async function validateImageUrl(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

/**
 * * Preload an image with error handling
 * @param {string} src - Image source URL
 * @returns {Promise<HTMLImageElement>} Loaded image element
 */
export async function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (_error) => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * * Get fallback image URL when primary image fails
 * @param {string} originalSrc - Original image source
 * @returns {string} Fallback image URL
 */
export function getFallbackImageUrl(_originalSrc) {
  return '/assets/images/IMG_0778.jpg';
}

/**
 * * Compress an image file to WebP using a canvas
 * @param {File} file - Original image file
 * @param {Object} options - { maxWidth, maxHeight, quality }
 * @returns {Promise<File>} Compressed image as a File (webp) or original on failure
 */
export async function compressImageFile(
  file,
  { maxWidth = 1600, maxHeight = 1600, quality = 0.8 } = {}
) {
  try {
    const img = await loadImageFromFile(file);
    const { width, height } = img;
    let targetW = width;
    let targetH = height;

    // Fit within max dimensions preserving aspect ratio
    const scale = Math.min(maxWidth / width, maxHeight / height, 1);
    targetW = Math.round(width * scale);
    targetH = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d', { alpha: true });
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(
        resolve,
        'image/webp',
        Math.min(Math.max(quality, 0.1), 0.95)
      )
    );

    if (!blob) return file; // fallback

    const base = file.name.replace(/\.[^.]+$/, '') || 'image';
    const compressed = new File([blob], `${base}.webp`, { type: 'image/webp' });
    return compressed;
  } catch {
    return file; // fallback to original if anything fails
  }
}

// * Tournament Utilities
/**
 * * Initialize sorter pairs if not already done
 * @param {Object} sorter - The sorter object
 * @param {Array} nameList - Array of name strings
 */
export function initializeSorterPairs(sorter, nameList) {
  if (!Array.isArray(sorter._pairs)) {
    sorter._pairs = generatePairs(nameList);
    sorter._pairIndex = 0;
  }
}

/**
 * * Get preferences map from sorter
 * @param {Object} sorter - The sorter object
 * @returns {Map} Preferences map
 */
export function getPreferencesMap(sorter) {
  return sorter.preferences instanceof Map ? sorter.preferences : new Map();
}

/**
 * * Calculate the blended rating for a name
 * @param {number} existingRating - Previous rating value
 * @param {number} position - Position in sorted list
 * @param {number} totalNames - Total number of names
 * @param {number} matchesPlayed - Matches completed
 * @param {number} maxMatches - Total matches in tournament
 * @returns {number} Final rating between 1000 and 2000
 */
export function computeRating(
  existingRating,
  position,
  totalNames,
  matchesPlayed,
  maxMatches
) {
  const ratingSpread = Math.min(1000, totalNames * 25);
  const positionValue =
    ((totalNames - position - 1) / (totalNames - 1)) * ratingSpread;
  const newPositionRating = 1500 + positionValue;
  const blendFactor = Math.min(0.8, (matchesPlayed / maxMatches) * 0.9);
  const newRating = Math.round(
    blendFactor * newPositionRating + (1 - blendFactor) * existingRating
  );
  return Math.max(1000, Math.min(2000, newRating));
}

// * Performance Monitoring
/**
 * * Performance monitoring class
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      bundleSize: {},
      loadTimes: {},
      runtimeMetrics: {},
      memoryUsage: {}
    };
    this.observers = [];
  }

  /**
   * * Track bundle size metrics (async)
   */
  async trackBundleSize() {
    if (typeof window === 'undefined') return;

    // * In development mode, use Vite's module analysis
    if (process.env.NODE_ENV === 'development') {
      this.metrics.bundleSize = {
        javascript: this.estimateDevBundleSize(),
        css: this.estimateDevCSSSize(),
        total: this.estimateDevBundleSize() + this.estimateDevCSSSize(),
        timestamp: Date.now(),
        mode: 'development-estimate'
      };
      console.log('📊 Bundle Size Metrics (Dev Estimate):', this.metrics.bundleSize);
      return;
    }

    // * Use requestIdleCallback to avoid blocking the main thread
    if ('requestIdleCallback' in window) {
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
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));

    let totalJS = 0;
    let totalCSS = 0;

    try {
      // * Process scripts asynchronously with batching to prevent blocking
      const scriptSizes = await Promise.all(
        scripts.map(script => this.getResourceSize(script.src))
      );
      totalJS = scriptSizes.reduce((sum, size) => sum + (size || 0), 0);

      // * Process stylesheets asynchronously with batching
      const stylesheetSizes = await Promise.all(
        stylesheets.map(link => this.getResourceSize(link.href))
      );
      totalCSS = stylesheetSizes.reduce((sum, size) => sum + (size || 0), 0);
    } catch (error) {
      console.warn('⚠️ Error calculating bundle size:', error);
      // * Fallback to 0 if calculation fails
      totalJS = 0;
      totalCSS = 0;
    }

    this.metrics.bundleSize = {
      javascript: totalJS,
      css: totalCSS,
      total: totalJS + totalCSS,
      timestamp: Date.now(),
      mode: 'production'
    };

    console.log('📊 Bundle Size Metrics:', this.metrics.bundleSize);
  }

  /**
   * * Track page load times
   */
  trackLoadTimes() {
    if (typeof window === 'undefined') return;

    // * Use a more robust approach for load time tracking
    const trackLoadMetrics = () => {
      // * Use requestAnimationFrame to avoid forced reflows
      requestAnimationFrame(() => {
        const [navigation] = performance.getEntriesByType('navigation');

        if (!navigation) {
          console.warn('⚠️ Navigation timing not available');
          return;
        }

        // * Calculate safe timing values with proper fallbacks
        const domContentLoaded = Math.max(0,
          navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
        );
        const loadComplete = Math.max(0,
          navigation.loadEventEnd - navigation.loadEventStart
        );
        const totalLoadTime = Math.max(0,
          navigation.loadEventEnd - navigation.fetchStart
        );

        this.metrics.loadTimes = {
          domContentLoaded,
          loadComplete,
          totalLoadTime,
          firstPaint: this.getFirstPaint(),
          firstContentfulPaint: this.getFirstContentfulPaint(),
          timestamp: Date.now()
        };

        console.log('⏱️ Load Time Metrics:', this.metrics.loadTimes);
      });
    };

    // * Track immediately if already loaded, otherwise wait for load event
    if (document.readyState === 'complete') {
      trackLoadMetrics();
    } else {
      window.addEventListener('load', trackLoadMetrics, { once: true });
    }
  }

  /**
   * * Track runtime performance
   */
  trackRuntimePerformance() {
    if (typeof window === 'undefined') return;

    // Track memory usage
    if (performance.memory) {
      this.metrics.memoryUsage = {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        timestamp: Date.now()
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

  // * Welcome screen removed – function deleted

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
      timestamp: Date.now()
    };

    console.log('🖼️ Image Loading Metrics:', {
      loaded: loadedCount,
      failed: failedCount,
      total: totalImages,
      successRate: `${successRate.toFixed(1)}%`
    });

    // * Warn if success rate is low
    if (successRate < 80 && totalImages > 0) {
      console.warn('⚠️ Low image loading success rate:', `${successRate.toFixed(1)}%`);
    }
  }

  /**
   * * Get resource size from URL (async)
   * @param {string} url - Resource URL
   * @returns {Promise<number>} Resource size in bytes
   */
  async getResourceSize(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const contentLength = response.headers.get('Content-Length');
      return parseInt(contentLength || '0');
    } catch {
      return 0;
    }
  }

  /**
   * * Get First Paint time
   * @returns {number} First paint time in milliseconds
   */
  getFirstPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : 0;
  }

  /**
   * * Get First Contentful Paint time
   * @returns {number} First contentful paint time in milliseconds
   */
  getFirstContentfulPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
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
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      } : null
    };
  }

  /**
   * * Clean up observers
   */
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  /**
   * * Initialize all monitoring
   */
  init() {
    // * Use requestIdleCallback to defer initialization and avoid blocking
    if ('requestIdleCallback' in window) {
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
    this.trackBundleSize().catch(error => {
      console.warn('Bundle size calculation failed:', error);
    });
    this.trackLoadTimes();
    this.trackRuntimePerformance();

    // * In development, reduce monitoring frequency to improve performance
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Performance monitoring initialized (development mode)');
    }
  }
}

// * Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// * Auto-initialize in development
if (process.env.NODE_ENV === 'development') {
  performanceMonitor.init();
}

// * Logger utility
/**
 * * Log messages during development only
 * @param {...any} args - Arguments to log
 */
export function devLog(...args) {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[DEV]', ...args);
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Logger error:', error);
    }
  }
}

/**
 * * Structured logger for better debugging
 */
export const Logger = {
  /**
   * * Log info messages
   * @param {string} category - Log category (e.g., 'API', 'UI', 'State')
   * @param {string} message - Log message
   * @param {Object} data - Additional data to log
   */
  info: (category, message, data = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO:${category}]`, message, Object.keys(data).length > 0 ? data : '');
    }
  },

  /**
   * * Log warning messages
   * @param {string} category - Log category
   * @param {string} message - Warning message
   * @param {Object} data - Additional data
   */
  warn: (category, message, data = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[WARN:${category}]`, message, Object.keys(data).length > 0 ? data : '');
    }
  },

  /**
   * * Log error messages
   * @param {string} category - Log category
   * @param {string} message - Error message
   * @param {Error|Object} error - Error object or data
   */
  error: (category, message, error = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ERROR:${category}]`, message, error);
    }
  },

  /**
   * * Log debug messages (more verbose)
   * @param {string} category - Log category
   * @param {string} message - Debug message
   * @param {Object} data - Additional data
   */
  debug: (category, message, data = {}) => {
    if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_DEBUG === 'true') {
      console.debug(`[DEBUG:${category}]`, message, Object.keys(data).length > 0 ? data : '');
    }
  },

  /**
   * * Log performance metrics
   * @param {string} operation - Operation name
   * @param {number} duration - Duration in milliseconds
   * @param {Object} metadata - Additional metadata
   */
  performance: (operation, duration, metadata = {}) => {
    if (process.env.NODE_ENV === 'development') {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      console.log(
        `[PERF${isMobile ? ':MOBILE' : ''}]`,
        `${operation}: ${duration.toFixed(2)}ms`,
        Object.keys(metadata).length > 0 ? metadata : ''
      );
    }
  },

  /**
   * * Group related logs
   * @param {string} label - Group label
   * @param {Function} fn - Function to execute within group
   */
  group: (label, fn) => {
    if (process.env.NODE_ENV === 'development') {
      console.group(label);
      try {
        fn();
      } finally {
        console.groupEnd();
      }
    } else {
      fn();
    }
  }
};

// * Performance optimization utilities
/**
 * * Throttle function to prevent excessive calls
 * @param {Function} func - Function to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, delay) {
  let timeoutId;
  let lastExecTime = 0;

  return function (...args) {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}

/**
 * * Debounce function to delay execution until after calls have stopped
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, delay) {
  let timeoutId;

  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * * Request animation frame wrapper to prevent forced reflows
 * @param {Function} callback - Function to execute on next frame
 * @returns {number} Animation frame ID
 */
export function safeRequestAnimationFrame(callback) {
  return requestAnimationFrame(() => {
    // * Use another RAF to ensure we're not in a forced reflow
    requestAnimationFrame(callback);
  });
}

/**
 * * Batch DOM updates to prevent layout thrashing
 * @param {Function} updateFunction - Function containing DOM updates
 */
export function batchDOMUpdates(updateFunction) {
  // * Use RAF to batch updates
  requestAnimationFrame(() => {
    // * Temporarily disable layout calculations
    const originalStyle = document.body.style.display;
    document.body.style.display = 'none';

    // * Perform updates
    updateFunction();

    // * Re-enable layout calculations
    document.body.style.display = originalStyle;
  });
}

// * Export individual functions and classes
export {
  performanceMonitor,
  loadImageFromFile
};

// * Default export with all utilities
export default {
  // Array utilities
  shuffleArray,
  generatePairs,
  buildComparisonsMap,

  // Image utilities
  validateImageUrl,
  preloadImage,
  getFallbackImageUrl,
  compressImageFile,

  // Tournament utilities
  initializeSorterPairs,
  getPreferencesMap,
  computeRating,

  // Performance monitoring
  PerformanceMonitor,
  performanceMonitor
};
