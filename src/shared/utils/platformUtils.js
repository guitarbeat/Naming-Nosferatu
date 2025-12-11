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
  return /Mac|iPhone|iPod|iPad/i.test(
    navigator.platform || navigator.userAgent,
  );
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
export function formatShortcut(
  key,
  { ctrl = false, shift = false, alt = false } = {},
) {
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

/**
 * Check if a keyboard event is an activation key (Enter or Space)
 * @param {KeyboardEvent} event - The keyboard event
 * @returns {boolean} True if the key is Enter or Space
 */
export function isActivationKey(event) {
  return event.key === "Enter" || event.key === " ";
}

/**
 * Check if a keyboard event matches a shortcut
 * @param {KeyboardEvent} event - The keyboard event
 * @param {string} key - The key to match
 * @param {Object} modifiers - Modifier keys { ctrl, shift, alt }
 * @returns {boolean} True if the event matches the shortcut
 */
export function matchesShortcut(
  event,
  key,
  { ctrl = false, shift = false, alt = false } = {},
) {
  const isMac = isMacPlatform();
  const ctrlKey = isMac ? event.metaKey : event.ctrlKey;

  return (
    event.key.toLowerCase() === key.toLowerCase() &&
    ctrlKey === ctrl &&
    event.shiftKey === shift &&
    event.altKey === alt
  );
}

/**
 * Create a keyboard event handler for activation keys
 * @param {Function} callback - Function to call when activation key is pressed
 * @returns {Function} Event handler function
 */
export function createActivationHandler(callback) {
  return (event) => {
    if (isActivationKey(event)) {
      event.preventDefault();
      callback(event);
    }
  };
}

// Default export removed - use named exports instead
// export default {
//   isMacPlatform,
//   getModifierKey,
//   formatShortcut,
//   getShortcutString,
//   isActivationKey,
//   matchesShortcut,
//   createActivationHandler,
//   SHORTCUTS,
// };
