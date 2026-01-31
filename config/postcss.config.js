import discardUnused from "postcss-discard-unused";

// ts-prune-ignore-next (entry point for PostCSS)
export default {
	plugins: {
		"@tailwindcss/postcss": {},
		...(process.env.NODE_ENV === "production" && {
			"postcss-discard-unused": discardUnused({
				fontFace: true,
				counterStyle: true,
				keyframes: true,
				namespace: true,
			}),
		}),
	},
};
