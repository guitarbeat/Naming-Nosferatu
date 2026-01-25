/**
 * @file Shared Utilities Barrel Export
 * @description Consolidated utility functions for the application
 *
 * Modules:
 * - basic: Array manipulation, caching, date formatting, logging, CSV export
 * - names: Cat images, name generation, filtering (includes fetchCatAvatars)
 * - performance: Web vitals monitoring
 * - ui: Classnames (cn), rank display, image compression, haptics, sound, metrics
 */

export * from "./basic";
export * from "./names";
export * from "./performance";
export * from "./ui";
