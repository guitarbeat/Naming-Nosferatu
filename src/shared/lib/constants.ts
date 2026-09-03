// ═══════════════════════════════════════════════════════════════════════════════
// Cat Images & Fallback Assets
// ═══════════════════════════════════════════════════════════════════════════════

export const CAT_IMAGES = [
	"/assets/images/cats/cat_01.webp",
	"/assets/images/cats/cat_02.webp",
	"/assets/images/cats/cat_03.webp",
	"/assets/images/cats/cat_04.webp",
	"/assets/images/cats/cat_05.webp",
	"/assets/images/cats/cat_06.webp",
	"/assets/images/cats/cat_07.webp",
	"/assets/images/cats/cat_08.webp",
	"/assets/images/cats/cat_09.webp",
	"/assets/images/cats/cat_10.webp",
	"/assets/images/cats/cat_11.webp",
	"/assets/images/cats/cat_12.webp",
	"/assets/images/cats/cat_13.webp",
	"/assets/images/cats/cat_14.webp",
] as const;

/**
 * Bulletproof inline SVG data URI fallback for images to prevent browser broken-image icons.
 */
export const FALLBACK_CAT_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <rect width="100" height="100" rx="20" fill="#18181b"/>
  <path d="M28 44L20 26C19.5 25 21 24 22 24.5L36 32C40 30.5 44.8 29.5 50 29.5C55.2 29.5 60 30.5 64 32L78 24.5C79 24 80.5 25 80 26L72 44C76 48.5 78 54 78 60C78 74 65.5 84 50 84C34.5 84 22 74 22 60C22 54 24 48.5 28 44Z" fill="#27272a" stroke="#52525b" stroke-width="2"/>
  <circle cx="38" cy="54" r="4.5" fill="#a1a1aa"/>
  <circle cx="62" cy="54" r="4.5" fill="#a1a1aa"/>
  <polygon points="50,62 46,67 54,67" fill="#f43f5e"/>
  <path d="M46 67 Q50 71 54 67" stroke="#71717a" stroke-width="1.5" fill="none"/>
</svg>`,
)}`;

/**
 * Primary local fallback image path.
 */
export const FALLBACK_CAT_IMAGE = "/assets/images/ui/cat_avatar_placeholder.png";

/**
 * Critical images required by the app shell (navigation, persona selectors, loading screens, and primary avatars).
 */
export const CRITICAL_SHELL_IMAGES = [
	"/assets/images/ui/cat_avatar_placeholder.png",
	"/assets/images/ui/favicon.png",
	"/assets/images/ui/loading_preview.png",
	"/assets/images/ui/cat_graphic_hd.png",
	"/assets/logos/reactbits-gh-white.svg",
	"/assets/images/cats/baby_cat.gif",
	"/assets/images/cats/cat.gif",
	"/assets/images/cats/cat_01.webp",
	"/assets/images/cats/cat_02.webp",
	"/assets/images/cats/cat_03.webp",
	"/assets/images/cats/cat_04.webp",
	"/assets/images/cats/cat_05.webp",
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
