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

// ============================================================================
// Export Utilities (from exportUtils.ts)
// ============================================================================

interface ExportNameItem {
  name: string;
  description?: string;
  user_rating?: number;
  avg_rating?: number;
  rating?: number;
  user_wins?: number;
  wins?: number;
  user_losses?: number;
  losses?: number;
  matches?: number;
  isHidden?: boolean;
  [key: string]: unknown;
}

type FieldAccessor<T> = string | ((item: T) => unknown);

interface ExportOptions<T> {
  fileName?: string;
  headers?: string[];
  fields?: FieldAccessor<T>[];
  includeDate?: boolean;
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getDateString(): string {
  const [date] = new Date().toISOString().split("T");
  return date;
}

function escapeCSVValue(value: unknown): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function arrayToCSV<T extends Record<string, unknown>>(
  data: T[],
  headers: string[],
  fields: FieldAccessor<T>[]
): string {
  if (!data || data.length === 0) return "";

  const headerRow = headers.map(escapeCSVValue).join(",");

  const dataRows = data.map((item) =>
    fields
      .map((field) => {
        const value = typeof field === "function" ? field(item) : item[field];
        return escapeCSVValue(value);
      })
      .join(",")
  );

  return [headerRow, ...dataRows].join("\n");
}

function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  options: ExportOptions<T> = {}
): boolean {
  const {
    fileName = "export",
    headers = [],
    fields = [],
    includeDate = true,
  } = options;

  if (!data || data.length === 0) {
    console.warn("No data to export");
    return false;
  }

  const effectiveHeaders = headers.length > 0 ? headers : Object.keys(data[0]);
  const effectiveFields = fields.length > 0 ? fields : (Object.keys(data[0]) as FieldAccessor<T>[]);

  const csvContent = arrayToCSV(data, effectiveHeaders, effectiveFields);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  const fullFileName = includeDate
    ? `${fileName}_${getDateString()}.csv`
    : `${fileName}.csv`;

  downloadBlob(blob, fullFileName);
  return true;
}

export function exportNamesToCSV(names: ExportNameItem[], fileName = "cat-names-export"): boolean {
  return exportToCSV(names, {
    fileName,
    headers: ["Name", "Description", "Rating", "Wins", "Losses", "Hidden"],
    fields: [
      "name",
      "description",
      (item) => item.user_rating || item.avg_rating || 1500,
      (item) => item.user_wins || item.wins || 0,
      (item) => item.user_losses || item.losses || 0,
      (item) => (item.isHidden ? "Yes" : "No"),
    ],
  });
}

export type NameId = string | number;

/**
 * * Extract name IDs from selected names value
 */
export function extractNameIds(selectedNamesValue: string[] | NameItem[] | Set<string>): NameId[] {
  if (Array.isArray(selectedNamesValue)) {
    // Check if it's an array of objects with an ID or just strings
    if (selectedNamesValue.length > 0 && typeof selectedNamesValue[0] === 'object' && 'id' in selectedNamesValue[0]) {
      return (selectedNamesValue as NameItem[]).map((n) => n.id as NameId);
    }
    // Assume it's an array of strings if not objects
    // (or empty array, which returns empty)
    return selectedNamesValue as NameId[];
  }
  if (selectedNamesValue instanceof Set) {
    return Array.from(selectedNamesValue) as NameId[];
  }
  return [];
}

/**
 * * Filter out hidden names
 */
export function getVisibleNames(names: NameItem[]): NameItem[] {
  if (!Array.isArray(names)) return [];
  return names.filter((name) => !isNameHidden(name));
}

export function exportTournamentResultsToCSV(
  names: ExportNameItem[],
  fileName = "tournament-results"
): boolean {
  return exportToCSV(names, {
    fileName,
    headers: ["Name", "Rating", "Wins", "Losses", "Matches"],
    fields: [
      "name",
      (item) => item.rating || 0,
      (item) => item.wins || 0,
      (item) => item.losses || 0,
      (item) => item.matches || 0,
    ],
  });
}

// ============================================================================
// Metrics Utilities (from metricsUtils.ts)
// ============================================================================

interface InsightCategory {
  label: string;
  description: string;
  icon: string;
  color: string;
}

const INSIGHT_CATEGORIES: Record<string, InsightCategory> = {
  top_rated: {
    label: "Top Rated",
    description: "In the top 10% by rating",
    icon: "⭐",
    color: "var(--color-gold, #f59e0b)",
  },
  trending_up: {
    label: "Trending Up",
    description: "Gaining popularity",
    icon: "📈",
    color: "var(--color-success, #22c55e)",
  },
  trending_down: {
    label: "Trending Down",
    description: "Losing popularity",
    icon: "📉",
    color: "var(--color-danger, #ef4444)",
  },
  most_selected: {
    label: "Most Selected",
    description: "One of the top selections",
    icon: "👍",
    color: "var(--color-info, #3b82f6)",
  },
  underrated: {
    label: "Underrated",
    description: "Good rating but low selections",
    icon: "💎",
    color: "var(--color-purple, #a855f7)",
  },
  new: {
    label: "New",
    description: "Recently added",
    icon: "✨",
    color: "var(--color-cyan, #06b6d4)",
  },
  undefeated: {
    label: "Undefeated",
    description: "No losses yet",
    icon: "🏆",
    color: "var(--color-gold, #f59e0b)",
  },
  undiscovered: {
    label: "Undiscovered",
    description: "Never selected yet",
    icon: "🔍",
    color: "var(--color-subtle, #6b7280)",
  },
};

export function getInsightCategory(categoryKey: string): InsightCategory | null {
  return INSIGHT_CATEGORIES[categoryKey] || null;
}

const METRIC_LABELS: Record<string, string> = {
  rating: "Rating",
  total_wins: "Wins",
  selected: "Selected",
  avg_rating: "Avg Rating",
  wins: "Wins",
  dateSubmitted: "Date Added",
};

export function getMetricLabel(metricKey: string): string {
  return METRIC_LABELS[metricKey] || metricKey;
}

export function calculatePercentile(
  value: number,
  allValues: number[],
  higherIsBetter = true
): number {
  if (!allValues || allValues.length === 0) return 50;

  const validValues = allValues.filter((v) => v != null && !isNaN(v));
  if (validValues.length === 0) return 50;

  const sorted = [...validValues].sort((a, b) => a - b);

  if (higherIsBetter) {
    const belowCount = sorted.filter((v) => v < value).length;
    return Math.round((belowCount / sorted.length) * 100);
  } else {
    const aboveCount = sorted.filter((v) => v > value).length;
    return Math.round((aboveCount / sorted.length) * 100);
  }
}

interface RatingData {
  rating: number;
  wins: number;
  losses: number;
}

interface RatingItem extends RatingData {
  name: string;
}

interface RatingDataInput {
  rating: number;
  wins?: number;
  losses?: number;
}

export function ratingsToArray(
  ratings: Record<string, RatingDataInput | number> | RatingItem[],
): RatingItem[] {
  if (Array.isArray(ratings)) {
    return ratings;
  }

  return Object.entries(ratings).map(([name, data]) => ({
    name,
    rating:
      typeof data === "number"
        ? data
        : (data as RatingDataInput)?.rating || 1500,
    wins: typeof data === "object" ? (data as RatingDataInput)?.wins || 0 : 0,
    losses:
      typeof data === "object" ? (data as RatingDataInput)?.losses || 0 : 0,
  }));
}

export function ratingsToObject(
  ratingsArray: RatingItem[],
): Record<string, RatingData> {
  if (!Array.isArray(ratingsArray)) {
    return {};
  }

  return ratingsArray.reduce(
    (acc, item) => {
      acc[item.name] = {
        rating: item.rating || 1500,
        wins: item.wins || 0,
        losses: item.losses || 0,
      };
      return acc;
    },
    {} as Record<string, RatingData>,
  );
}

// ============================================================================
// Performance Monitoring Utilities (from performanceMonitor.ts)
// ============================================================================

const isDevelopment = process.env.NODE_ENV === "development";

const performanceMetrics = {
  metrics: {} as Record<string, number>,
  observers: [] as PerformanceObserver[],
};

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

export function initializePerformanceMonitoring() {
  if (!isDevelopment || typeof window === "undefined") {
    return;
  }

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

// ============================================================================
// Tournament Utilities (from tournamentUtils.ts)
// ============================================================================

interface Sorter {
  _pairs?: Array<[unknown, unknown]>;
  _pairIndex?: number;
  preferences?: Map<string, unknown>;
}

export function initializeSorterPairs(sorter: Sorter | null, nameList: NameItem[]): void {
  if (!sorter) {
    return;
  }
  if (!Array.isArray(sorter._pairs)) {
    const validNameList = Array.isArray(nameList) ? nameList : [];
    sorter._pairs = generatePairs(validNameList);
    sorter._pairIndex = 0;
  }
}

export function getPreferencesMap(sorter: Sorter): Map<string, unknown> {
  return sorter.preferences instanceof Map ? sorter.preferences : new Map();
}

function calculateMaxRoundForNames(namesCount: number): number {
  let maxRound = 1;
  let remainingNames = namesCount;

  while (remainingNames > 1) {
    const matchesThisRound = Math.floor(remainingNames / 2);
    const winners = matchesThisRound;
    const byes = remainingNames % 2;
    remainingNames = winners + byes;
    maxRound++;
  }

  return maxRound;
}

export function calculateBracketRound(namesCount: number, matchNumber: number): number {
  if (!Number.isInteger(namesCount) || namesCount < 1) {
    return 1;
  }
  if (!Number.isInteger(matchNumber) || matchNumber < 1) {
    return 1;
  }

  const maxMatches = namesCount - 1;
  if (matchNumber > maxMatches) {
    return calculateMaxRoundForNames(namesCount);
  }

  if (namesCount === 2) {
    return 1;
  }

  let roundNumber = 1;
  let remainingNames = namesCount;
  let matchesPlayed = 0;
  const maxRounds = Math.ceil(Math.log2(namesCount)) + 1;

  while (matchesPlayed < matchNumber - 1 && roundNumber < maxRounds) {
    const matchesThisRound = Math.floor(remainingNames / 2);

    if (matchesPlayed + matchesThisRound >= matchNumber) {
      break;
    }

    matchesPlayed += matchesThisRound;
    const winners = matchesThisRound;
    const byes = remainingNames % 2;
    remainingNames = winners + byes;
    roundNumber++;
  }

  return roundNumber;
}

// ============================================================================
// UI Utilities (from uiUtils.ts)
// ============================================================================

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function getRankDisplay(rank: number): string {
  if (rank === 1) return "🥇 1st";
  if (rank === 2) return "🥈 2nd";
  if (rank === 3) return "🥉 3rd";
  if (rank <= 10) return `🏅 ${rank}th`;
  return `${rank}th`;
}

export function normalizeRoutePath(routeValue: string): string {
  if (!routeValue) return "/";
  return routeValue.startsWith("/") ? routeValue : `/${routeValue}`;
}

const isBrowser = () => typeof window !== "undefined";
const canUseMatchMedia = () => isBrowser() && typeof window.matchMedia === "function";

export const getMediaQueryList = (query: string): MediaQueryList | null => {
  if (!canUseMatchMedia()) return null;
  try {
    return window.matchMedia(query);
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.warn("Invalid media query:", query, error);
    return null;
  }
};

export const attachMediaQueryListener = (mediaQueryList: MediaQueryList | null, listener: (event: MediaQueryListEvent) => void): () => void => {
  if (!mediaQueryList || typeof listener !== "function") return () => { };
  if (typeof mediaQueryList.addEventListener === "function") {
    mediaQueryList.addEventListener("change", listener);
    return () => mediaQueryList.removeEventListener("change", listener);
  }
  if (typeof mediaQueryList.addListener === "function") {
    mediaQueryList.addListener(listener);
    return () => mediaQueryList.removeListener(listener);
  }
  return () => { };
};

async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

export async function compressImageFile(
  file: File,
  { maxWidth = 1600, maxHeight = 1600, quality = 0.8 }: { maxWidth?: number; maxHeight?: number; quality?: number } = {},
): Promise<File> {
  try {
    const img = await loadImageFromFile(file);
    const { width, height } = img;
    const scale = Math.min(maxWidth / width, maxHeight / height, 1);
    const targetW = Math.round(width * scale);
    const targetH = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", Math.min(Math.max(quality, 0.1), 0.95))
    );
    if (!blob) return file;

    const base = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${base}.webp`, { type: "image/webp" });
  } catch {
    return file;
  }
}

// ============================================================================
// Authentication Utilities (from authUtils.ts)
// ============================================================================

import { resolveSupabaseClient } from "../services/supabase/supabaseClient";

const USER_ROLES = {
  USER: "user",
  MODERATOR: "moderator",
  ADMIN: "admin",
};

const ROLE_SOURCES = ["user_roles"];

const ROLE_PRIORITY = {
  [USER_ROLES.USER]: 0,
  [USER_ROLES.MODERATOR]: 1,
  [USER_ROLES.ADMIN]: 2,
};

const normalizeRole = (role: string | null | undefined): string | null =>
  role?.toLowerCase?.() ?? null;

const compareRoles = (
  currentRole: string | null | undefined,
  requiredRole: string | null | undefined,
): boolean => {
  const current =
    ROLE_PRIORITY[normalizeRole(currentRole) as keyof typeof ROLE_PRIORITY] ??
    -1;
  const required =
    ROLE_PRIORITY[normalizeRole(requiredRole) as keyof typeof ROLE_PRIORITY] ??
    Number.POSITIVE_INFINITY;

  return current >= required;
};

const normalizeStatusCode = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const numericMatch = value.match(/\d{3}/);
    if (numericMatch) {
      return Number.parseInt(numericMatch[0], 10);
    }
  }

  return null;
};

const extractErrorMetadata = (error: unknown) => {
  const statuses = new Set<number>();
  const codes = new Set<string>();
  const messages = new Set<string>();

  const stack = [error];
  const visited = new Set<unknown>();

  while (stack.length) {
    const current = stack.pop();

    if (current == null) {
      continue;
    }

    if (typeof current === "string") {
      messages.add(current);
      continue;
    }

    if (typeof current !== "object") {
      continue;
    }

    if (visited.has(current)) {
      continue;
    }

    visited.add(current);

    if (Array.isArray(current)) {
      for (const entry of current) {
        stack.push(entry);
      }
      continue;
    }

    const obj = current as Record<string, unknown>;
    const candidateStatuses = [
      obj.status,
      obj.statusCode,
      obj.status_code,
      obj.responseStatus,
      obj.statusText,
      (obj.response as Record<string, unknown>)?.status,
      (obj.response as Record<string, unknown>)?.statusCode,
      (obj.response as Record<string, unknown>)?.status_code,
      (
        (obj.response as Record<string, unknown>)?.response as Record<
          string,
          unknown
        >
      )?.status,
      (
        (obj.response as Record<string, unknown>)?.error as Record<
          string,
          unknown
        >
      )?.status,
      (obj.error as Record<string, unknown>)?.status,
      (obj.error as Record<string, unknown>)?.statusCode,
      (obj.error as Record<string, unknown>)?.status_code,
      (obj.originalError as Record<string, unknown>)?.status,
      (obj.originalError as Record<string, unknown>)?.statusCode,
      (obj.originalError as Record<string, unknown>)?.status_code,
      (obj.data as Record<string, unknown>)?.status,
      (obj.data as Record<string, unknown>)?.statusCode,
      (obj.data as Record<string, unknown>)?.status_code,
    ];

    for (const candidate of candidateStatuses) {
      const normalized = normalizeStatusCode(candidate);
      if (normalized != null) {
        statuses.add(normalized);
      }
    }

    const candidateCodes = [
      obj.code,
      obj.sqlState,
      (obj.error as Record<string, unknown>)?.code,
      (obj.response as Record<string, unknown>)?.code,
      (
        (obj.response as Record<string, unknown>)?.error as Record<
          string,
          unknown
        >
      )?.code,
      (obj.data as Record<string, unknown>)?.code,
      (obj.originalError as Record<string, unknown>)?.code,
    ];

    for (const candidate of candidateCodes) {
      if (candidate == null) continue;
      const normalized = String(candidate).trim().toUpperCase();
      if (normalized) {
        codes.add(normalized);
      }
    }

    const messageKeys = [
      "message",
      "error",
      "error_description",
      "errorMessage",
      "error_message",
      "hint",
      "details",
      "detail",
      "description",
      "body",
      "msg",
      "responseText",
    ];

    for (const key of messageKeys) {
      const value = (current as Record<string, unknown>)[key];
      if (typeof value === "string") {
        messages.add(value);
      }
    }

    for (const value of Object.values(current)) {
      if (value && typeof value === "object") {
        stack.push(value);
      } else if (typeof value === "string") {
        messages.add(value);
      }
    }
  }

  return {
    statuses: [...statuses],
    codes: [...codes],
    messages: [...messages].map((message) => message.toLowerCase()),
  };
};

const isMissingResourceError = (error: unknown): boolean => {
  if (!error) return false;
  const { statuses, codes, messages } = extractErrorMetadata(error);

  const normalizedStatuses = statuses
    .map((value) => normalizeStatusCode(value))
    .filter((value) => value != null);

  const normalizedCodes = codes
    .map((value) => String(value).trim().toUpperCase())
    .filter((value) => value.length > 0);

  const statusIndicatesMissing = normalizedStatuses.some(
    (value) => value === 404 || value === 410,
  );

  const knownMissingCodes = new Set([
    "404",
    "PGRST301",
    "PGRST303",
    "PGRST304",
    "PGRST404",
    "42P01",
    "42704",
    "42883",
  ]);

  const codeIndicatesMissing = normalizedCodes.some((value) =>
    knownMissingCodes.has(value),
  );

  const missingMessagePatterns = [
    "does not exist",
    "not found",
    "missing from the schema",
    "undefined table",
    "undefined function",
    "unknown function",
    "no function matches the given name and argument types",
    'relation "',
  ];

  const messageIndicatesMissing = messages.some((message) =>
    missingMessagePatterns.some((pattern) => message.includes(pattern)),
  );

  return (
    statusIndicatesMissing || codeIndicatesMissing || messageIndicatesMissing
  );
};

const isRpcParameterMismatchError = (error: unknown): boolean => {
  if (!error) return false;

  const { codes, messages } = extractErrorMetadata(error);

  const mismatchCodes = new Set(["42883", "42703"]);

  if (codes.some((value) => mismatchCodes.has(value))) {
    return true;
  }

  const parameterMismatchPatterns = [
    "missing required input parameter",
    "unexpected parameter",
    "unexpected key",
    "invalid parameter",
    "invalid input syntax",
    "required parameter",
    "function has_role(",
  ];

  return messages.some((message) =>
    parameterMismatchPatterns.some((pattern) => message.includes(pattern)),
  );
};

const isUuid = (value: unknown): boolean =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

interface ClientState {
  canUseRoleRpc: boolean;
  preferredRoleSource: string;
  disabledSources: Set<string>;
}

const clientStateMap = new WeakMap<object, ClientState>();

const getClientState = (client: object | null) => {
  if (!client) {
    return {
      canUseRoleRpc: false,
      preferredRoleSource: ROLE_SOURCES[0],
      disabledSources: new Set<string>(),
    };
  }

  let state = clientStateMap.get(client);

  if (!state) {
    state = {
      canUseRoleRpc: true,
      preferredRoleSource: ROLE_SOURCES[0],
      disabledSources: new Set<string>(),
    };
    clientStateMap.set(client, state);
  }

  return state;
};

const markSourceSuccessful = (
  state: ClientState | undefined,
  source: string,
) => {
  if (!state) return;
  state.disabledSources.delete(source);
  state.preferredRoleSource = source;
};

const markSourceUnavailable = (
  state: ClientState | undefined,
  source: string,
) => {
  if (!state) return;
  state.disabledSources.add(source);

  if (state.preferredRoleSource === source) {
    const fallback = ROLE_SOURCES.find(
      (candidate) =>
        candidate !== source && !state.disabledSources.has(candidate),
    );

    if (fallback) {
      state.preferredRoleSource = fallback;
    }
  }
};

const getRoleSourceOrder = (state: ClientState | undefined) => {
  if (!state) return [...ROLE_SOURCES];

  const orderedSources = new Set();

  const preferred =
    state.preferredRoleSource &&
      !state.disabledSources.has(state.preferredRoleSource)
      ? state.preferredRoleSource
      : ROLE_SOURCES.find((source) => !state.disabledSources.has(source));

  if (preferred) {
    orderedSources.add(preferred);
  } else if (state.preferredRoleSource) {
    orderedSources.add(state.preferredRoleSource);
  }

  for (const source of ROLE_SOURCES) {
    if (!state.disabledSources.has(source)) {
      orderedSources.add(source);
    }
  }

  for (const source of ROLE_SOURCES) {
    orderedSources.add(source);
  }

  return [...orderedSources];
};

const handleRoleResponse = (
  data: Record<string, unknown> | null,
  error: unknown,
  source: string,
  state: ClientState | undefined,
  roleKey: string,
) => {
  if (error) {
    if (isMissingResourceError(error)) {
      markSourceUnavailable(state, source);
      return { role: null, handled: true };
    }
    throw error;
  }

  markSourceSuccessful(state, source);
  return { role: data?.[roleKey] ?? null, handled: false };
};

const fetchRoleFromSource = async (
  activeSupabase: unknown,
  userName: string,
  source: string,
  state: ClientState | undefined,
) => {
  const hasFromMethod = (client: unknown): client is { from: (table: string) => unknown } => {
    return !!client && typeof client === 'object' && 'from' in client && typeof (client as { from?: unknown }).from === 'function';
  };

  if (!activeSupabase || !hasFromMethod(activeSupabase)) return { role: null, handled: true };

  const trimmedUserName = userName.trim?.() ?? userName;

  if (source === "user_roles") {
    const { data, error } = await (activeSupabase.from("user_roles") as {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          order: (column: string, options: { ascending: boolean }) => {
            limit: (count: number) => {
              maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: unknown }>;
            };
          };
        };
      };
    })
      .select("role")
      .eq("user_name", trimmedUserName)
      .order("role", { ascending: false })
      .limit(1)
      .maybeSingle();

    return handleRoleResponse(data, error, source, state, "role");
  }

  return { role: null, handled: true };
};

const fetchUserRole = async (activeSupabase: unknown, userName: string) => {
  const state = getClientState(activeSupabase as object | null);
  const sources = getRoleSourceOrder(state);

  for (const source of sources) {
    try {
      const result = await fetchRoleFromSource(
        activeSupabase,
        userName,
        source as string,
        state,
      );
      if (result?.handled) {
        continue;
      }
      if (result?.role) {
        return normalizeRole(result.role as string);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(
          `Error fetching user role from Supabase source "${source}":`,
          error,
        );
      }
      continue;
    }
  }

  return null;
};

async function _hasRole(
  userName: string,
  requiredRole: string,
): Promise<boolean> {
  if (!userName || !requiredRole) return false;

  const activeSupabase = await resolveSupabaseClient();

  if (!activeSupabase) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "Supabase client is not configured. Role check will default to false.",
      );
    }
    return false;
  }

  try {
    const trimmedUserName = userName.trim?.() ?? userName;
    const normalizedRequiredRole = normalizeRole(requiredRole);
    const state = getClientState(activeSupabase);

    if (!normalizedRequiredRole) {
      return false;
    }

    if (state?.canUseRoleRpc) {
      const rpcPayloads: Record<string, string>[] = [
        { _user_name: trimmedUserName, _role: normalizedRequiredRole },
      ];

      if (isUuid(trimmedUserName)) {
        rpcPayloads.push({
          _user_id: trimmedUserName,
          _role: normalizedRequiredRole,
        });
      }

      let lastRpcError = null;

      for (const payload of rpcPayloads) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (activeSupabase as any).rpc(
          "has_role",
          payload,
        );

        if (!error) {
          return data === true;
        }

        lastRpcError = error;

        if (isRpcParameterMismatchError(error)) {
          continue;
        }

        if (isMissingResourceError(error)) {
          state.canUseRoleRpc = false;
          break;
        }

        throw error;
      }

      if (lastRpcError && isMissingResourceError(lastRpcError)) {
        state.canUseRoleRpc = false;
      }
    }

    const userRole = await fetchUserRole(activeSupabase, trimmedUserName);
    if (!userRole) {
      return false;
    }

    return compareRoles(userRole, normalizedRequiredRole);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error checking user role:", error);
    }
    return false;
  }
}

export async function isUserAdmin(userIdOrName: string): Promise<boolean> {
  return _hasRole(userIdOrName, USER_ROLES.ADMIN);
}

// ============================================================================
// Name Utilities (from nameUtils.ts)
// ============================================================================

/**
 * Converts an array of selected names to a Set of IDs for O(1) lookup.
 * Handles both array of objects and existing Set.
 */
export function selectedNamesToSet(
  selectedNames: NameItem[] | Set<string | number>,
): Set<string | number> {
  if (selectedNames instanceof Set) {
    return selectedNames;
  }
  return new Set(selectedNames.map((n) => n.id));
}

// --- Generation Utils ---

const FUNNY_PREFIXES = [
  "Captain", "Dr.", "Professor", "Lord", "Lady", "Sir", "Duchess",
  "Count", "Princess", "Chief", "Master", "Agent", "Detective", "Admiral"
];

const FUNNY_ADJECTIVES = [
  "Whiskers", "Purrington", "Meowington", "Pawsome", "Fluffles", "Scratchy",
  "Naptastic", "Furball", "Cattastic", "Pawdorable", "Whiskertron", "Purrfect"
];

/**
 * Sanitize a generated name to remove invalid characters
 */
function sanitizeGeneratedName(value: string) {
  return value
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Generate a fun random name
 */
export function generateFunName() {
  let attempts = 0;
  let generatedName = "";

  while (!generatedName && attempts < 3) {
    const prefix = FUNNY_PREFIXES[Math.floor(Math.random() * FUNNY_PREFIXES.length)];
    const adjective = FUNNY_ADJECTIVES[Math.floor(Math.random() * FUNNY_ADJECTIVES.length)];

    generatedName = sanitizeGeneratedName(`${prefix} ${adjective}`);
    attempts += 1;
  }

  return generatedName || "Cat Judge";
}

// --- Filter Utils ---

interface FilterOptions {
  searchTerm?: string;
  category?: string | null;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  visibility?: "visible" | "hidden" | "all";
  isAdmin?: boolean;
}

/**
 * Check if a name is hidden
 */
export function isNameHidden(name: NameItem | null | undefined): boolean {
  return name?.is_hidden === true || name?.isHidden === true;
}


/**
 * Map filterStatus to visibility string
 */
export function mapFilterStatusToVisibility(filterStatus: string): "hidden" | "all" | "visible" {
  if (filterStatus === "hidden") return "hidden";
  if (filterStatus === "all") return "all";
  return "visible";
}

/**
 * Internal visibility filter
 */
function filterByVisibility(
  names: NameItem[] | null | undefined,
  { visibility = "visible", isAdmin = false }: { visibility?: "visible" | "hidden" | "all"; isAdmin?: boolean } = {},
): NameItem[] {
  if (!Array.isArray(names)) return [];
  if (!isAdmin) return names.filter((name) => !isNameHidden(name));

  switch (visibility) {
    case "hidden": return names.filter((name) => isNameHidden(name));
    case "all": return names;
    case "visible":
    default: return names.filter((name) => !isNameHidden(name));
  }
}

/**
 * Apply all filters to names
 */
export function applyNameFilters(names: NameItem[] | null | undefined, filters: FilterOptions = {}): NameItem[] {
  const {
    searchTerm = "",
    category = null,
    sortBy = "rating",
    sortOrder = "desc",
    visibility = "visible",
    isAdmin = false,
  } = filters;

  if (!names || !Array.isArray(names)) return [];
  let result = filterByVisibility([...names], { visibility, isAdmin });

  if (category) {
    result = result.filter(n => n.categories && n.categories.includes(category));
  }

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    result = result.filter(n =>
      (n.name && n.name.toLowerCase().includes(term)) ||
      (n.description && n.description.toLowerCase().includes(term))
    );
  }

  const multiplier = sortOrder === "asc" ? 1 : -1;
  result.sort((a, b) => {
    let comp = 0;
    switch (sortBy) {
      case "rating": comp = (a.avg_rating || 1500) - (b.avg_rating || 1500); break;
      case "name":
      case "alphabetical": comp = (a.name || "").localeCompare(b.name || ""); break;
      case "wins": comp = (a.wins || 0) - (b.wins || 0); break;
      case "losses": comp = (a.losses || 0) - (b.losses || 0); break;
      case "winRate": {
        const aW = a.wins || 0, aL = a.losses || 0, bW = b.wins || 0, bL = b.losses || 0;
        comp = (aW + aL > 0 ? aW / (aW + aL) : 0) - (bW + bL > 0 ? bW / (bW + bL) : 0);
        break;
      }
      case "created": comp = (a.created_at ? new Date(a.created_at).getTime() : 0) - (b.created_at ? new Date(b.created_at).getTime() : 0); break;
      case "popularity": comp = (a.popularity_score || 0) - (b.popularity_score || 0); break;
      default: comp = (a.avg_rating || 1500) - (b.avg_rating || 1500);
    }
    return comp * multiplier;
  });

  return result;
}
