/**
 * @module constants
 * @description Centralized application configuration and constants.
 *
 * Every exported object uses `as const` for literal type inference.
 * Organize new constants under the most specific existing section,
 * or add a clearly-labeled new section at the bottom.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// Cat Images
// ═══════════════════════════════════════════════════════════════════════════════

export const CAT_IMAGES = [
	"/assets/images/bby-cat.GIF",
	"/assets/images/cat.gif",
	"/assets/images/IMG_4844.avif",
	"/assets/images/IMG_4845.avif",
	"/assets/images/IMG_4846.avif",
	"/assets/images/IMG_4847.avif",
	"/assets/images/IMG_5044.avif",
	"/assets/images/IMG_5071.avif",
	"/assets/images/IMG_0778.avif",
	"/assets/images/IMG_0779.avif",
	"/assets/images/IMG_0865.avif",
	"/assets/images/IMG_0884.avif",
	"/assets/images/IMG_0923.avif",
	"/assets/images/IMG_1116.avif",
	"/assets/images/IMG_7205.avif",
	"/assets/images/75209580524__60DCC26F-55A1-4EF8-A0B2-14E80A026A8D.avif",
] as const;

// ═══════════════════════════════════════════════════════════════════════════════
// Filter Options
// ═══════════════════════════════════════════════════════════════════════════════

export const FILTER_OPTIONS = {
	VISIBILITY: {
		ALL: "all",
		VISIBLE: "visible",
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
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// Validation
// ═══════════════════════════════════════════════════════════════════════════════

export const VALIDATION = {
	// Generic name fields
	MIN_NAME_LENGTH: 1,
	MAX_NAME_LENGTH: 50,

	// Cat names (wider range than generic names)
	MIN_CAT_NAME_LENGTH: 1,
	MAX_CAT_NAME_LENGTH: 100,

	// Descriptions
	/** Minimum for optional description fields (e.g. profile bio) */
	MIN_DESCRIPTION_LENGTH: 0,
	MAX_DESCRIPTION_LENGTH: 500,
	/** Stricter minimum for required descriptions (e.g. name suggestions) */
	MIN_DESCRIPTION_LENGTH_REQUIRED: 10,

	// Username
	MIN_USERNAME_LENGTH: 2,
	MAX_USERNAME_LENGTH: 50,
	/** Strict: alphanumeric, underscore, hyphen */
	USERNAME_PATTERN: /^[a-zA-Z0-9_-]+$/,
	/** Relaxed: also allows spaces */
	USERNAME_PATTERN_EXTENDED: /^[a-zA-Z0-9\s\-_]+$/,

	// Email
	EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

	// Tournament
	MIN_TOURNAMENT_SIZE: 2,
	MAX_TOURNAMENT_SIZE: 64,
	MIN_RATING: 0,
	MAX_RATING: 3000,
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// Tournament Timing
// ═══════════════════════════════════════════════════════════════════════════════

/** All durations in milliseconds. */
export const TOURNAMENT_TIMING = {
	VOTE_COOLDOWN: 150,
	UNDO_WINDOW_MS: 2000,
	UNDO_UPDATE_INTERVAL: 200,
	MATCH_RESULT_SHOW_DELAY: 200,
	MATCH_RESULT_HIDE_DELAY: 800,
	TOAST_SUCCESS_DURATION: 1500,
	TOAST_ERROR_DURATION: 3000,
	RENDER_LOG_THROTTLE: 1000,
	ROUND_TRANSITION_DELAY: 600,
	TRANSITION_DELAY_SHORT: 50,
	TRANSITION_DELAY_MEDIUM: 100,
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// General Timing
// ═══════════════════════════════════════════════════════════════════════════════

/** All durations in milliseconds. */
export const TIMING = {
	// Network
	SUPABASE_CLIENT_TIMEOUT_MS: 10_000,

	// Animations
	RIPPLE_ANIMATION_DURATION_MS: 600,
	EAR_TWITCH_DURATION_MS: 150,
	LIGHTBOX_TRANSITION_DURATION_MS: 300,

	// Debounce / throttle
	SAVE_DEBOUNCE_DELAY_MS: 500,

	// Status messages
	STATUS_SUCCESS_DISPLAY_DURATION_MS: 2000,
	STATUS_ERROR_DISPLAY_DURATION_MS: 3000,

	// Interaction
	PAUSE_CHECK_INTERVAL_MS: 1000,
	LONG_PRESS_TIMEOUT_MS: 1000,
	IDLE_PAUSE_THRESHOLD_MS: 5000,
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// Notifications
// ═══════════════════════════════════════════════════════════════════════════════

/** All durations in milliseconds. */
export const NOTIFICATION = {
	DEFAULT_DURATION_MS: 5000,
	SUCCESS_DURATION_MS: 5000,
	ERROR_DURATION_MS: 7000,
	MAX_TOASTS: 5,
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// Elo Rating System
// ═══════════════════════════════════════════════════════════════════════════════

export const ELO_RATING = {
	DEFAULT_RATING: 1500,
	DEFAULT_K_FACTOR: 40,
	MIN_RATING: 800,
	MAX_RATING: 2400,
	RATING_DIVISOR: 400,

	// K-factor adjustment thresholds
	LOW_RATING_THRESHOLD: 1400,
	HIGH_RATING_THRESHOLD: 2000,
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
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// Local Storage Keys
// ═══════════════════════════════════════════════════════════════════════════════

export const STORAGE_KEYS = {
	USER: "catNamesUser",
	USER_AVATAR: "catNamesUserAvatar",
	THEME: "theme",
	SWIPE_MODE: "tournamentSwipeMode",
	TOURNAMENT: "tournament-storage",
	USER_STORAGE: "user-storage",
	ANALYSIS_DASHBOARD_COLLAPSED: "analysis-dashboard-collapsed",
	ADMIN_ANALYTICS_COLLAPSED: "admin-analytics-collapsed",
	NAVBAR_COLLAPSED: "navbar-collapsed",
	SOUND_ENABLED: "soundEnabled",
	MUSIC_VOLUME: "musicVolume",
	EFFECTS_VOLUME: "effectsVolume",
} as const;
