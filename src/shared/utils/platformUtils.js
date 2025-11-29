/**
 * @module platformUtils
 * @description Utility functions for platform detection and keyboard shortcuts.
 */

/**
 * Check if the current platform is macOS/iOS
 * @returns {boolean} True if running on Apple platform
 */
export function isMacPlatform() {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPod|iPad/i.test(navigator.platform || navigator.userAgent);
}

/**
 * Get the modifier key symbol for the current platform
 * @returns {string} "⌘" for Mac, "Ctrl" for others
 */
export function getModifierKey() {
  return isMacPlatform() ? "⌘" : "Ctrl";
}

/**
 * Get a formatted keyboard shortcut string for the current platform
 * @param {string} key - The key (e.g., "A", "S", "Enter")
 * @param {Object} modifiers - Modifier keys { ctrl, shift, alt }
 * @returns {string} Formatted shortcut string
 */
export function formatShortcut(key, { ctrl = false, shift = false, alt = false } = {}) {
  const isMac = isMacPlatform();
  const parts = [];
  
  if (ctrl) parts.push(isMac ? "⌘" : "Ctrl");
  if (shift) parts.push(isMac ? "⇧" : "Shift");
  if (alt) parts.push(isMac ? "⌥" : "Alt");
  parts.push(key);
  
  return isMac ? parts.join("") : parts.join("+");
}

/**
 * Common keyboard shortcuts used in the app
 */
export const SHORTCUTS = {
  ANALYSIS_MODE: { key: "A", ctrl: true, shift: true },
  SIDEBAR_TOGGLE: { key: "B", ctrl: true },
  SEARCH: { key: "K", ctrl: true },
};

/**
 * Get formatted shortcut for a named action
 * @param {string} action - Action name from SHORTCUTS
 * @returns {string} Formatted shortcut string
 */
export function getShortcutString(action) {
  const shortcut = SHORTCUTS[action];
  if (!shortcut) return "";
  return formatShortcut(shortcut.key, shortcut);
}

export default {
  isMacPlatform,
  getModifierKey,
  formatShortcut,
  getShortcutString,
  SHORTCUTS,
};
