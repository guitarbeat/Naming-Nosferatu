/**
 * @module BongoCatConstants
 * @description Constants for Bongo Cat component including cat variants, personalities, and animation states
 */

/**
 * Cat color variants with their color schemes
 * @type {Object<string, Object>}
 */
export const CAT_VARIANTS = {
  black: {
    bg: "#000",
    outline: "#222",
    toebean: "#44262c",
    name: "Black Cat",
  },
  white: {
    bg: "#fff",
    outline: "#eee",
    toebean: "#ffb3d9",
    name: "White Cat",
  },
  orange: {
    bg: "#ff8c42",
    outline: "#e67e30",
    toebean: "#ff6b9d",
    name: "Orange Tabby",
  },
  gray: {
    bg: "#6c757d",
    outline: "#5a6268",
    toebean: "#ff6b9d",
    name: "Gray Cat",
  },
  calico: {
    bg: "#ff6b9d",
    outline: "#e55a8a",
    toebean: "#44262c",
    name: "Calico",
  },
  siamese: {
    bg: "#f0e6d2",
    outline: "#d4c4a8",
    toebean: "#ff6b9d",
    name: "Siamese",
  },
};

/**
 * Personality modes that affect animation behavior
 * @type {Object<string, Object>}
 */
export const PERSONALITY_MODES = {
  playful: {
    name: "Playful",
    description: "Energetic and bouncy animations",
    idleBreathingSpeed: 1.2,
    earTwitchFrequency: 0.8,
    tailSwishSpeed: 1.5,
    eyeTrackingSpeed: 1.3,
  },
  sleepy: {
    name: "Sleepy",
    description: "Calm and relaxed animations",
    idleBreathingSpeed: 0.6,
    earTwitchFrequency: 0.3,
    tailSwishSpeed: 0.5,
    eyeTrackingSpeed: 0.7,
  },
  energetic: {
    name: "Energetic",
    description: "Fast and excited animations",
    idleBreathingSpeed: 1.5,
    earTwitchFrequency: 1.2,
    tailSwishSpeed: 2.0,
    eyeTrackingSpeed: 1.8,
  },
};

/**
 * Animation states for the cat
 * @type {Object<string, string>}
 */
const _ANIMATION_STATES = {
  IDLE: "idle",
  TYPING_SLOW: "typing-slow",
  TYPING_FAST: "typing-fast",
  BACKSPACE: "backspace",
  SLEEPY: "sleepy",
  CELEBRATING: "celebrating",
  EXCITED: "excited",
};

/**
 * Typing speed thresholds (characters per second)
 * @type {Object<string, number>}
 */
const _TYPING_SPEED_THRESHOLDS = {
  SLOW: 2, // Below 2 cps = slow
  FAST: 6, // Above 6 cps = fast
};

/**
 * Milestone thresholds for celebration animations
 * @type {number[]}
 */
const _MILESTONE_THRESHOLDS = [10, 25, 50, 100, 250, 500, 1000];

/**
 * Default configuration
 * @type {Object}
 */
export const DEFAULT_CONFIG = {
  variant: "black",
  personality: "playful",
  size: 0.5,
  enableSounds: false,
  reduceMotion: false,
  position: "auto", // "auto" | "top" | "bottom" | "left" | "right"
};
