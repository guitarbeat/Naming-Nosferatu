/**
 * @module constants
 * @description Centralized application constants for consistency and maintainability.
 */

// * Filter Options
// * Simplified: names are either visible or hidden
// ts-prune-ignore-next (used via barrel export from core/constants)
export const FILTER_OPTIONS = {
	VISIBILITY: {
		ALL: "all",
		VISIBLE: "visible", // Default - show non-hidden names
		HIDDEN: "hidden", // Show only hidden names
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
// ts-prune-ignore-next (used via barrel export from core/constants)
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
// ts-prune-ignore-next (used via barrel export from core/constants)
export const TOURNAMENT_TIMING = {
	VOTE_COOLDOWN: 150, // Reduced from 300ms for faster voting
	UNDO_WINDOW_MS: 2000,
	MATCH_RESULT_SHOW_DELAY: 200, // Reduced from 300ms
	MATCH_RESULT_HIDE_DELAY: 800, // Reduced from 1200ms
	TOAST_SUCCESS_DURATION: 1500, // Reduced from 2000ms
	TOAST_ERROR_DURATION: 3000, // Reduced from 3500ms
	RENDER_LOG_THROTTLE: 1000,
	ROUND_TRANSITION_DELAY: 600, // Reduced from 1000ms
	UNDO_UPDATE_INTERVAL: 200,
	TRANSITION_DELAY_SHORT: 50, // Reduced from 80ms
	TRANSITION_DELAY_MEDIUM: 100, // Reduced from 150ms
};

// * General Timing Constants
// ts-prune-ignore-next (used via barrel export from core/constants)
export const TIMING = {
	// Network and API timeouts
	SUPABASE_CLIENT_TIMEOUT_MS: 10000,
	// Animation durations
	RIPPLE_ANIMATION_DURATION_MS: 600,
	EAR_TWITCH_DURATION_MS: 150,
	LIGHTBOX_TRANSITION_DURATION_MS: 300,
	// Debounce and throttle delays
	SAVE_DEBOUNCE_DELAY_MS: 500,
	// Status message display durations
	STATUS_SUCCESS_DISPLAY_DURATION_MS: 2000,
	STATUS_ERROR_DISPLAY_DURATION_MS: 3000,
	// Check intervals
	PAUSE_CHECK_INTERVAL_MS: 1000,
	LONG_PRESS_TIMEOUT_MS: 1000,
	// Pause detection
	IDLE_PAUSE_THRESHOLD_MS: 5000,
};

// * Toast and Notification Constants
// ts-prune-ignore-next (used via barrel export from core/constants)
export const NOTIFICATION = {
	DEFAULT_DURATION_MS: 5000,
	ERROR_DURATION_MS: 7000,
	SUCCESS_DURATION_MS: 5000,
	MAX_TOASTS: 5,
};

// * Elo Rating System Constants
// ts-prune-ignore-next (used via barrel export from core/constants)
export const ELO_RATING = {
	DEFAULT_RATING: 1500,
	DEFAULT_K_FACTOR: 40,
	MIN_RATING: 800,
	MAX_RATING: 2400,
	RATING_DIVISOR: 400,
	// Rating thresholds for K-factor adjustment
	LOW_RATING_THRESHOLD: 1400,
	HIGH_RATING_THRESHOLD: 2000,
	// Game count threshold for K-factor adjustment
	NEW_PLAYER_GAME_THRESHOLD: 15,
	// K-factor multipliers
	NEW_PLAYER_K_MULTIPLIER: 2,
	EXTREME_RATING_K_MULTIPLIER: 1.5,
	// Match outcome scores
	WIN_SCORE: 1,
	LOSS_SCORE: 0,
	BOTH_WIN_SCORE: 0.7,
	NEITHER_WIN_SCORE: 0.3,
	TIE_SCORE: 0.5,
};

// * Mobile Gesture Thresholds
// ts-prune-ignore-next (used via barrel export from core/constants)
export const GESTURE_THRESHOLDS = {
	SWIPE_DISTANCE_PX: 50,
	LONG_PRESS_DURATION_MS: 500,
	DOUBLE_TAP_INTERVAL_MS: 300,
	PINCH_SCALE_THRESHOLD: 0.1,
	TOUCH_DISTANCE_THRESHOLD_PX: 10,
	TOUCH_DURATION_THRESHOLD_MS: 300,
};

// * Local Storage Keys
// ts-prune-ignore-next (used via barrel export from core/constants)
export const STORAGE_KEYS = {
	USER: "catNamesUser",
	THEME: "theme",
	TOURNAMENT: "tournament-storage",
	USER_STORAGE: "user-storage",
	ANALYSIS_DASHBOARD_COLLAPSED: "analysis-dashboard-collapsed",
	ADMIN_ANALYTICS_COLLAPSED: "admin-analytics-collapsed",
	NAVBAR_COLLAPSED: "navbar-collapsed",
	SOUND_ENABLED: "soundEnabled",
	MUSIC_VOLUME: "musicVolume",
	EFFECTS_VOLUME: "effectsVolume",
} as const;
