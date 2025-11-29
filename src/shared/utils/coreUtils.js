/**
 * @module coreUtils
 * @description Consolidated utility functions for the cat names application.
 * This file re-exports from modular utility files for backward compatibility.
 */

// * Re-export array utilities
export * from "./arrayUtils";

// * Re-export image utilities
export * from "./imageUtils";

// * Re-export tournament utilities
export * from "./tournamentUtils";

// * Re-export performance utilities
export * from "./performanceUtils";

// * Re-export logger utilities
export * from "./logger";

// * Re-export performance monitor
export { performanceMonitor } from "./performanceMonitor";

// * Re-export display utilities
export * from "./displayUtils";

// * Re-export time utilities
export * from "./timeUtils";

// * Re-export platform utilities
export * from "./platformUtils";

// * Re-export export utilities
export * from "./exportUtils";

// * Re-export function utilities
export * from "./functionUtils";

// * Re-export className utilities
export * from "./classNameUtils";

// * Re-export name filter utilities (simplified visibility filtering)
export * from "./nameFilterUtils";
