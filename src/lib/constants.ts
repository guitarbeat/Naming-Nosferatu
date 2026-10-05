export const CAT_IMAGES: readonly string[] = [
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

export const FALLBACK_CAT_IMAGE = "/assets/images/ui/cat_avatar_placeholder.png";

export const FALLBACK_CAT_SVG =
	"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%236366f1'><circle cx='50' cy='50' r='45'/><text x='50' y='65' font-size='40' text-anchor='middle' fill='white'>🐱</text></svg>";

export const CRITICAL_SHELL_IMAGES: readonly string[] = [
	...CAT_IMAGES,
	"/assets/images/ui/cat_graphic_hd.png",
	"/assets/images/ui/cat_avatar_placeholder.png",
	"/assets/images/ui/loading_preview.png",
] as const;

export const STORAGE_KEYS = {
	USER: "nn_user",
	USER_ID: "nn_user_id",
	USER_AVATAR: "nn_user_avatar",
	USER_STORAGE: "nn_user_storage",
	TOURNAMENT: "nn_tournament",
	THEME: "nn_theme",
} as const;

export const ELO_RATING = {
	DEFAULT_RATING: 1200,
	DEFAULT_K_FACTOR: 32,
	RATING_DIVISOR: 400,
	MIN_RATING: 100,
	MAX_RATING: 3000,
	NEW_PLAYER_GAME_THRESHOLD: 10,
	NEW_PLAYER_K_MULTIPLIER: 1.5,
} as const;

export const TIMING = {
	VOTE_COOLDOWN_MS: 300,
} as const;
