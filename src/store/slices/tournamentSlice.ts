import { type AppSliceCreator, patch } from "@/store/appStore.shared";
import type { AppState } from "@/store/appStore.types";

export const createTournamentSlice: AppSliceCreator<
	Pick<AppState, "tournament" | "tournamentActions">
> = (set, get) => ({
	tournament: {
		names: null,
		ratings: {},
		isComplete: false,
		isLoading: false,
		voteHistory: [],
		selectedNames: [],
	},

	tournamentActions: {
		setNames: (names) => {
			const currentRatings = get().tournament.ratings;
			patch(set, "tournament", {
				names:
					names?.map((name) => ({
						id: name.id,
						name: name.name,
						description: name.description,
						rating: currentRatings[name.name]?.rating ?? 1500,
					})) ?? null,
			});
		},

		setRatings: (ratingsOrFn) => {
			const current = get().tournament.ratings;
			const next = typeof ratingsOrFn === "function" ? ratingsOrFn(current) : ratingsOrFn;
			patch(set, "tournament", { ratings: { ...current, ...next } });
		},

		setComplete: (isComplete) => patch(set, "tournament", { isComplete }),

		resetTournament: () =>
			patch(set, "tournament", {
				names: null,
				isComplete: false,
			}),

		setSelection: (selectedNames) => patch(set, "tournament", { selectedNames }),
	},
});
