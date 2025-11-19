/**
 * @module coreUtils
 * @description Consolidated utility functions for the cat names application.
 * This file re-exports from modular utility files for backward compatibility.
 */

// * Re-export array utilities
export * from './arrayUtils';

// * Re-export image utilities
export * from './imageUtils';

// * Re-export tournament utilities
export * from './tournamentUtils';

// * Re-export performance utilities
export * from './performanceUtils';

// * Re-export logger utilities
export * from './logger';

// * Re-export performance monitor
export { PerformanceMonitor, performanceMonitor } from './performanceMonitor';

// * Default export with all utilities for backward compatibility
import {
  shuffleArray,
  generatePairs,
  buildComparisonsMap
} from './arrayUtils';

import {
  validateImageUrl,
  preloadImage,
  getFallbackImageUrl,
  compressImageFile,
  loadImageFromFile
} from './imageUtils';

import {
  initializeSorterPairs,
  getPreferencesMap,
  computeRating
} from './tournamentUtils';

import { PerformanceMonitor, performanceMonitor } from './performanceMonitor';

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
