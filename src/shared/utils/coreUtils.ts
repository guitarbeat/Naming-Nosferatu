/**
 * @module coreUtils
 * @description Consolidated core utility functions for the cat names application.
 */

import { VALIDATION } from "../../core/constants";
import { NameItem } from "../propTypes";
import { queryClient } from "../services/supabase/queryClient";

// ============================================================================
// Array Utilities (from arrayUtils.ts)
// ============================================================================

/**
 * * Shuffles an array using the Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * * Generate all possible pairs from a list of names
 */
export function generatePairs(nameList: NameItem[]): [NameItem, NameItem][] {
    const pairs: [NameItem, NameItem][] = [];
    for (let i = 0; i < nameList.length; i++) {
        for (let j = i + 1; j < nameList.length; j++) {
            pairs.push([nameList[i], nameList[j]]);
        }
    }
    return pairs;
}

interface ComparisonHistory {
    winner: string;
    loser: string;
}

/**
 * * Build a comparisons map from tournament history
 */
export function buildComparisonsMap(history: ComparisonHistory[]): Map<string, number> {
    const map = new Map<string, number>();
    history.forEach(({ winner, loser }) => {
        const winnerCount = (map.get(winner) || 0) + 1;
        const loserCount = (map.get(loser) || 0) + 1;
        map.set(winner, winnerCount);
        map.set(loser, loserCount);
    });
    return map;
}

// ============================================================================
// Time Utilities (from timeUtils.ts)
// ============================================================================

/**
 * Format a date as relative time (e.g., "just now", "5m ago", "2h ago")
 */
export function formatRelativeTime(date: Date | string | number) {
    if (!date) return null;

    const now = new Date();
    const then = date instanceof Date ? date : new Date(date);
    const diffSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diffSeconds < 10) return "just now";
    if (diffSeconds < 60) return `${diffSeconds}s ago`;

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return then.toLocaleDateString();
}

/**
 * Format a date to locale date string
 */
export function formatDate(
    date: Date | string | number,
    options: Intl.DateTimeFormatOptions = {},
) {
    if (!date) return "";
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString(undefined, options);
}

// ============================================================================
// Validation Utilities (from validationUtils.ts)
// ============================================================================

interface ValidationResult {
    success: boolean;
    error?: string;
    value?: string;
}

export const validateUsername = (username: string): ValidationResult => {
    if (!username || typeof username !== "string") {
        return { success: false, error: "Username is required" };
    }
    const trimmed = username.trim();
    if (trimmed.length < VALIDATION.MIN_USERNAME_LENGTH) {
        return { success: false, error: `Username must be at least ${VALIDATION.MIN_USERNAME_LENGTH} characters long` };
    }
    if (trimmed.length > VALIDATION.MAX_USERNAME_LENGTH) {
        return { success: false, error: `Username must be less than ${VALIDATION.MAX_USERNAME_LENGTH} characters` };
    }
    if (!VALIDATION.USERNAME_PATTERN_EXTENDED.test(trimmed)) {
        return { success: false, error: "Username can only contain letters, numbers, spaces, hyphens, and underscores" };
    }
    return { success: true, value: trimmed };
};

export const validateCatName = (name: string): ValidationResult => {
    if (!name || typeof name !== "string") return { success: false, error: "Cat name is required" };
    const trimmed = name.trim();
    if (trimmed.length < VALIDATION.MIN_CAT_NAME_LENGTH) {
        return { success: false, error: `Cat name must be at least ${VALIDATION.MIN_CAT_NAME_LENGTH} character long` };
    }
    if (trimmed.length > VALIDATION.MAX_CAT_NAME_LENGTH) {
        return { success: false, error: `Cat name must be less than ${VALIDATION.MAX_CAT_NAME_LENGTH} characters` };
    }
    return { success: true, value: trimmed };
};

export const validateDescription = (description: string): ValidationResult => {
    if (!description || typeof description !== "string") return { success: false, error: "Description is required" };
    const trimmed = description.trim();
    if (trimmed.length < VALIDATION.MIN_DESCRIPTION_LENGTH_EXTENDED) {
        return { success: false, error: `Description must be at least ${VALIDATION.MIN_DESCRIPTION_LENGTH_EXTENDED} characters long` };
    }
    if (trimmed.length > VALIDATION.MAX_DESCRIPTION_LENGTH) {
        return { success: false, error: `Description must be less than ${VALIDATION.MAX_DESCRIPTION_LENGTH} characters` };
    }
    return { success: true, value: trimmed };
};

// ============================================================================
// Cache Utilities (from cacheUtils.ts)
// ============================================================================

export function clearTournamentCache() {
    if (typeof window === "undefined") return;
    try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
            const key = window.localStorage.key(i);
            if (key && key.startsWith("tournament-")) keysToRemove.push(key);
        }
        keysToRemove.forEach((key) => window.localStorage.removeItem(key));
    } catch (error) {
        if (process.env.NODE_ENV === "development") console.error("Error clearing tournament cache:", error);
    }
}

export function clearAllCaches() {
    clearTournamentCache();
    try {
        queryClient.invalidateQueries({ queryKey: ["names"] });
        queryClient.invalidateQueries({ queryKey: ["catNames"] });
        queryClient.invalidateQueries({ queryKey: ["hiddenNames"] });
        queryClient.invalidateQueries({ queryKey: ["userRatings"] });
        queryClient.removeQueries({ queryKey: ["names"] });
        queryClient.removeQueries({ queryKey: ["catNames"] });
        queryClient.removeQueries({ queryKey: ["hiddenNames"] });
        queryClient.removeQueries({ queryKey: ["userRatings"] });
    } catch (error) {
        if (process.env.NODE_ENV === "development") console.error("Error clearing React Query cache:", error);
    }
}

// ============================================================================
// Logger Utilities (from logger.ts)
// ============================================================================

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const isDev = import.meta.env?.DEV || process.env.NODE_ENV === "development";
const noop = (..._args: unknown[]) => { };

export const devLog = isDev ? (...args: unknown[]) => console.log("[DEV]", ...args) : noop;
export const devWarn = isDev ? (...args: unknown[]) => console.warn("[DEV]", ...args) : noop;
export const devError = isDev ? (...args: unknown[]) => console.error("[DEV]", ...args) : noop;

// Re-exports
export * from "./tournamentUtils";
export * from "./uiUtils";
export * from "./metricsUtils";
export * from "./authUtils";
