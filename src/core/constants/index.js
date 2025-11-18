/**
 * @module constants
 * @description Centralized application constants for consistency and maintainability.
 */

// * Application Views
export const VIEWS = {
  TOURNAMENT: 'tournament',
  PROFILE: 'profile',
  RESULTS: 'results',
  LOADING: 'loading'
};

// * Tournament Constants
export const TOURNAMENT = {
  DEFAULT_RATING: 1500,
  MIN_NAMES: 2,
  MAX_NAMES: 100,
  RATING_K_FACTOR: 32,
  VOTE_THRESHOLD: 0.1
};

// * Filter Options
export const FILTER_OPTIONS = {
  STATUS: {
    ALL: 'all',
    ACTIVE: 'active',
    HIDDEN: 'hidden'
  },
  USER: {
    ALL: 'all',
    CURRENT: 'current',
    OTHER: 'other'
  },
  SORT: {
    RATING: 'rating',
    NAME: 'name',
    WINS: 'wins',
    LOSSES: 'losses',
    WIN_RATE: 'winRate',
    CREATED: 'created'
  },
  ORDER: {
    ASC: 'asc',
    DESC: 'desc'
  }
};

// * Error Types
export const ERROR_TYPES = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  AUTH: 'auth',
  DATABASE: 'database',
  UNKNOWN: 'unknown'
};

// * Error Severity Levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// * UI Constants
export const UI = {
  THEMES: {
    LIGHT: 'light',
    DARK: 'dark'
  },
  TOAST_POSITIONS: {
    TOP_RIGHT: 'top-right',
    TOP_LEFT: 'top-left',
    BOTTOM_RIGHT: 'bottom-right',
    BOTTOM_LEFT: 'bottom-left',
    TOP_CENTER: 'top-center',
    BOTTOM_CENTER: 'bottom-center'
  },
  TOAST_MAX_COUNT: 5,
  LOADING_DELAY: 300,
  ANIMATION_DURATION: 300
};

// * Database Constants
export const DATABASE = {
  TABLES: {
    CAT_NAME_OPTIONS: 'cat_name_options',
    CAT_NAME_RATINGS: 'cat_name_ratings',
    USER_PREFERENCES: 'user_preferences'
  },
  CONFLICT_RESOLUTION: {
    USER_NAME_ID: 'user_name,name_id'
  }
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
  MIN_DESCRIPTION_LENGTH_EXTENDED: 10
};

// * API Constants
export const API = {
  ENDPOINTS: {
    AUTH: '/auth',
    TOURNAMENT: '/tournament',
    RATINGS: '/ratings',
    PROFILE: '/profile'
  },
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

// * Local Storage Keys
export const STORAGE_KEYS = {
  THEME: 'name-nosferatu-theme',

  USER_PREFERENCES: 'name-nosferatu-preferences',
  TOURNAMENT_STATE: 'name-nosferatu-tournament-state'
};

// * Animation Constants
export const ANIMATION = {
  DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500
  },
  EASING: {
    EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
    EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
    EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
};

// * Accessibility Constants
export const A11Y = {
  SKIP_LINK_ID: 'main-content',
  ARIA_LIVE_POLITE: 'polite',
  ARIA_LIVE_ASSERTIVE: 'assertive',
  ARIA_BUSY: 'true',
  ARIA_STATUS: 'status'
};

// * Performance Constants
export const PERFORMANCE = {
  LAZY_LOAD_THRESHOLD: 100,
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 100,
  MEMOIZATION_TTL: 5 * 60 * 1000 // 5 minutes
};

// * Tournament Timing Constants
export const TOURNAMENT_TIMING = {
  VOTE_COOLDOWN: 500,
  UNDO_WINDOW_MS: 2500,
  MATCH_RESULT_SHOW_DELAY: 500,
  MATCH_RESULT_HIDE_DELAY: 2500,
  TOAST_SUCCESS_DURATION: 3000,
  TOAST_ERROR_DURATION: 5000,
  RENDER_LOG_THROTTLE: 1000,
  ROUND_TRANSITION_DELAY: 2000,
  UNDO_UPDATE_INTERVAL: 200,
  TRANSITION_DELAY_SHORT: 100,
  TRANSITION_DELAY_MEDIUM: 200
};

// * Audio Constants
export const AUDIO = {
  DEFAULT_MUSIC_VOLUME: 0.2,
  DEFAULT_EFFECTS_VOLUME: 0.3,
  AUDIO_RETRY_DELAY: 50,
  TRACK_CHANGE_DELAY: 50
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

export default {
  VIEWS,
  TOURNAMENT,
  FILTER_OPTIONS,
  ERROR_TYPES,
  ERROR_SEVERITY,
  UI,
  DATABASE,
  VALIDATION,
  API,
  STORAGE_KEYS,
  ANIMATION,
  A11Y,
  PERFORMANCE,
  TOURNAMENT_TIMING,
  AUDIO,
  MUSIC_TRACKS,
  SOUND_EFFECTS
};
