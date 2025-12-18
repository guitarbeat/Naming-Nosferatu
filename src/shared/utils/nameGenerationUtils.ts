/**
 * @module nameGenerationUtils
 * @description Utilities for generating fun random names
 */

const FUNNY_PREFIXES = [
  "Captain",
  "Dr.",
  "Professor",
  "Lord",
  "Lady",
  "Sir",
  "Duchess",
  "Count",
  "Princess",
  "Chief",
  "Master",
  "Agent",
  "Detective",
  "Admiral",
];

const FUNNY_ADJECTIVES = [
  "Whiskers",
  "Purrington",
  "Meowington",
  "Pawsome",
  "Fluffles",
  "Scratchy",
  "Naptastic",
  "Furball",
  "Cattastic",
  "Pawdorable",
  "Whiskertron",
  "Purrfect",
];

/**
 * Sanitize a generated name to remove invalid characters
 * @param {string} value - The name to sanitize
 * @returns {string} Sanitized name
 */
function sanitizeGeneratedName(value: string) {
  return value
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Generate a fun random name
 * @returns {string} Generated name or fallback
 */
export function generateFunName() {
  let attempts = 0;
  let generatedName = "";

  while (!generatedName && attempts < 3) {
    const prefix =
      FUNNY_PREFIXES[Math.floor(Math.random() * FUNNY_PREFIXES.length)];
    const adjective =
      FUNNY_ADJECTIVES[Math.floor(Math.random() * FUNNY_ADJECTIVES.length)];

    generatedName = sanitizeGeneratedName(`${prefix} ${adjective}`);
    attempts += 1;
  }

  return generatedName || "Cat Judge";
}
