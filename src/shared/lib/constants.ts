// ═══════════════════════════════════════════════════════════════════════════════
// Cat Images
// ═══════════════════════════════════════════════════════════════════════════════

export const CAT_IMAGES = [
	"/assets/images/cat_01.avif",
	"/assets/images/cat_02.avif",
	"/assets/images/cat_03.avif",
	"/assets/images/cat_04.avif",
	"/assets/images/cat_05.avif",
	"/assets/images/cat_06.avif",
	"/assets/images/cat_07.avif",
	"/assets/images/cat_08.avif",
	"/assets/images/cat_09.avif",
	"/assets/images/cat_10.avif",
	"/assets/images/cat_11.avif",
	"/assets/images/cat_12.avif",
	"/assets/images/cat_13.avif",
	"/assets/images/cat_14.avif",
] as const;

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
	USER_ID: "catNamesUserId",
	USER_AVATAR: "catNamesUserAvatar",
	THEME: "theme",
	TOURNAMENT: "tournament-storage",
	USER_STORAGE: "user-storage",
	ANALYSIS_DASHBOARD_COLLAPSED: "analysis-dashboard-collapsed",
	ADMIN_ANALYTICS_COLLAPSED: "admin-analytics-collapsed",
	NAVBAR_COLLAPSED: "navbar-collapsed",
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// Animation & Timing
// ═══════════════════════════════════════════════════════════════════════════════

export const TIMING = {
	RIPPLE_ANIMATION_DURATION_MS: 400,
	VOTE_COOLDOWN_MS: 500,
	TOURNAMENT_INIT_DELAY_MS: 16, // One frame for requestAnimationFrame

	// Unified motion language: startup + entrance animations
	MOTION_FAST: 0.3, // Quick state changes (icon swap, fade)
	MOTION_NORMAL: 0.5, // Standard entrance (text, buttons)
	MOTION_SLOW: 0.6, // Large elements (hero heading, CTA)
	MOTION_CYCLE: 1500, // Name carousel, loop timing
	MOTION_EASING: "easeOut", // Standard easing for entrances
} as const;
