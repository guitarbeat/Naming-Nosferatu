/**
 * @module constants
 * @description Centralized application constants for consistency and maintainability.
 */

// * Tournament Constants
export const TOURNAMENT = {
  DEFAULT_RATING: 1500,
  MIN_NAMES: 2,
  MAX_NAMES: 100,
  RATING_K_FACTOR: 32,
  VOTE_THRESHOLD: 0.1,
};

// * Filter Options
// * Simplified: names are either visible or hidden
export const FILTER_OPTIONS = {
  VISIBILITY: {
    ALL: "all",
    VISIBLE: "visible",  // Default - show non-hidden names
    HIDDEN: "hidden",    // Show only hidden names
  },
  // Legacy aliases for backward compatibility
  STATUS: {
    ALL: "all",
    ACTIVE: "active",  // Maps to VISIBLE
    HIDDEN: "hidden",
  },
  USER: {
    ALL: "all",
    CURRENT: "current",
    OTHER: "other",
  },
  SORT: {
    RATING: "rating",
    NAME: "name",
    WINS: "wins",
    LOSSES: "losses",
    WIN_RATE: "winRate",
    CREATED: "created",
  },
  ORDER: {
    ASC: "asc",
    DESC: "desc",
  },
};

// * Validation Constants
export const VALIDATION = {
  MIN_NAME_LENGTH: 1,
  MAX_NAME_LENGTH: 50,
  MIN_DESCRIPTION_LENGTH: 0,
  MAX_DESCRIPTION_LENGTH: 500,
  USERNAME_PATTERN: /^[a-zA-Z0-9_-]+$/,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // * Tournament validation
  MIN_TOURNAMENT_SIZE: 2,
  MAX_TOURNAMENT_SIZE: 64,
  MIN_RATING: 0,
  MAX_RATING: 3000,
  // * Username validation
  MIN_USERNAME_LENGTH: 2,
  MAX_USERNAME_LENGTH: 50,
  USERNAME_PATTERN_EXTENDED: /^[a-zA-Z0-9\s\-_]+$/,
  // * Cat name validation
  MIN_CAT_NAME_LENGTH: 1,
  MAX_CAT_NAME_LENGTH: 100,
  // * Description validation
  MIN_DESCRIPTION_LENGTH_EXTENDED: 10,
};

// * Tournament Timing Constants
export const TOURNAMENT_TIMING = {
  VOTE_COOLDOWN: 300,
  UNDO_WINDOW_MS: 2000,
  MATCH_RESULT_SHOW_DELAY: 300,
  MATCH_RESULT_HIDE_DELAY: 1200,
  TOAST_SUCCESS_DURATION: 2000,
  TOAST_ERROR_DURATION: 3500,
  RENDER_LOG_THROTTLE: 1000,
  ROUND_TRANSITION_DELAY: 1000,
  UNDO_UPDATE_INTERVAL: 200,
  TRANSITION_DELAY_SHORT: 80,
  TRANSITION_DELAY_MEDIUM: 150,
};

// * Audio Constants
export const AUDIO = {
  DEFAULT_MUSIC_VOLUME: 0.2,
  DEFAULT_EFFECTS_VOLUME: 0.3,
  AUDIO_RETRY_DELAY: 50,
  TRACK_CHANGE_DELAY: 50,
};

// * Music Tracks
export const MUSIC_TRACKS = [
  {
    path: "/assets/sounds/AdhesiveWombat - Night Shade.mp3",
    name: "Night Shade",
  },
  { path: "/assets/sounds/MiseryBusiness.mp3", name: "Misery Business" },
  { path: "/assets/sounds/what-is-love.mp3", name: "What is Love" },
  {
    path: "/assets/sounds/Lemon Demon - The Ultimate Showdown (8-Bit Remix).mp3",
    name: "Ultimate Showdown (8-Bit)",
  },
  { path: "/assets/sounds/Main Menu 1 (Ruins).mp3", name: "Ruins" },
];

// * Sound Effects
export const SOUND_EFFECTS = [
  { path: "/assets/sounds/gameboy-pluck.mp3", weight: 0.5 },
  { path: "/assets/sounds/wow.mp3", weight: 0.2 },
  { path: "/assets/sounds/surprise.mp3", weight: 0.1 },
  { path: "/assets/sounds/level-up.mp3", weight: 0.2 },
];

// * Local Storage Keys
export const STORAGE_KEYS = {
  USER: "catNamesUser",
  THEME: "catNamesTheme",
  ANALYSIS_DASHBOARD_COLLAPSED: "analysis-dashboard-collapsed",
  ADMIN_ANALYTICS_COLLAPSED: "admin-analytics-collapsed",
  SIDEBAR_COLLAPSED: "sidebar-collapsed",
  SOUND_ENABLED: "soundEnabled",
  MUSIC_VOLUME: "musicVolume",
  EFFECTS_VOLUME: "effectsVolume",
};
