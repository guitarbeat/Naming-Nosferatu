import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLocalStorage } from "@/hooks/useHooks";
import { useNameData, useNameSelection } from "@/hooks/useNames";
import { useToast } from "@/providers/Providers";
import { ErrorManager } from "@/services/errorManager";
import {
	calculateBracketRound,
	EloRating,
	PreferenceSorter,
	tournamentsAPI,
} from "@/services/tournament";
import useAppStore from "@/store/appStore";
import type {
	AppState,
	Match,
	MatchRecord,
	NameItem,
	PersistentState,
	TournamentFilters,
	TournamentUIState,
	UseNameManagementViewProps,
	UseNameManagementViewResult,
} from "@/types/appTypes";
import {
	applyNameFilters,
	clearTournamentCache,
	devError,
	devLog,
	devWarn,
	isNameHidden,
	mapFilterStatusToVisibility,
	ratingsToArray,
	ratingsToObject,
	shuffleArray,
} from "@/utils/basic";
import { FILTER_OPTIONS, NOTIFICATION, TOURNAMENT_TIMING } from "@/utils/constants";

/* =========================================================================
   TYPES & INTERFACES
   ========================================================================= */

export interface TournamentResult {
	name: string;
	rating: number;
	wins?: number;
	losses?: number;
}

export interface UseTournamentProps {
	names?: NameItem[];
	existingRatings?: Record<string, { rating: number; wins?: number; losses?: number }>;
	onComplete?: (results: TournamentResult[]) => void;
}

export interface UseTournamentHandlersProps {
	userName: string | null;
	tournamentActions: AppState["tournamentActions"];
}

interface UseTournamentSelectionSaverProps {
	userName: string | null;
	enableAutoSave?: boolean;
}

/* =========================================================================
   UTILITY FUNCTIONS
   ========================================================================= */

function getNextMatch(
	names: NameItem[],
	sorter: unknown,
	_matchNumber: number,
	_options: {
		currentRatings?: Record<string, { rating: number; wins?: number; losses?: number }>;
		history?: MatchRecord[];
	} = {},
): Match | null {
	if (!sorter || names.length <= 2) {
		return null;
	}

	const s = sorter as PreferenceSorter;

	try {
		const nm = s.getNextMatch();

		if (nm) {
			return {
				left: names.find((n) => n?.name === nm.left) || {
					name: nm.left,
					id: nm.left,
				},
				right: names.find((n) => n?.name === nm.right) || {
					name: nm.right,
					id: nm.right,
				},
			} as Match;
		}
	} catch (error) {
		if (import.meta.env.DEV) {
			console.warn("Could not get next match from sorter:", error);
		}
	}

	return null;
}

const createDefaultPersistentState = (userName: string): PersistentState => ({
	matchHistory: [],
	currentRound: 1,
	currentMatch: 1,
	totalMatches: 0,
	userName: userName || "anonymous",
	lastUpdated: Date.now(),
	namesKey: "",
});

/* =========================================================================
   AUDIO MANAGER HOOK
   ========================================================================= */

export function useAudioManager() {
	const [isMuted, setIsMuted] = useState(true);
	const [volume, setVolume] = useState(0.2);
	return {
		playAudioTrack: () => {
			/* No-op: handled by external audio services if available */
		},
		isMuted,
		handleToggleMute: () => setIsMuted((p) => !p),
		handleNextTrack: () => {
			/* No-op: logic not implemented for simple tournaments */
		},
		isShuffle: false,
		handleToggleShuffle: () => {
			/* No-op: logic not implemented for simple tournaments */
		},
		currentTrack: null,
		trackInfo: null,
		audioError: null,
		retryAudio: () => {
			/* No-op: handled by external audio services if available */
		},
		volume,
		handleVolumeChange: (_unused: unknown, v: number) => setVolume(Math.min(1, Math.max(0, v))),
	};
}

/* =========================================================================
   PROFILE NOTIFICATIONS HOOK
   ========================================================================= */

export function useProfileNotifications() {
	const {
		showSuccess: showSuccessToast,
		showError: showErrorToast,
		showToast: showToastMessage,
	} = useToast();

	const _showSuccess = useCallback(
		(message: string) => {
			devLog("✅", message);
			showSuccessToast(message, { duration: 5000 });
		},
		[showSuccessToast],
	);

	const _showError = useCallback(
		(message: string) => {
			devError("❌", message);
			showErrorToast(message, { duration: NOTIFICATION.ERROR_DURATION_MS });
		},
		[showErrorToast],
	);

	const _showToast = useCallback(
		(message: string, type: "success" | "error" | "info" | "warning" = "info") => {
			devLog(`📢 [${type}]`, message);
			showToastMessage(message, type, {
				duration: type === "error" ? 7000 : 5000,
			});
		},
		[showToastMessage],
	);

	return {
		showSuccess: _showSuccess,
		showError: _showError,
		showToast: _showToast,
	};
}

/* =========================================================================
   TOURNAMENT SELECTION SAVER HOOK
   ========================================================================= */

export function useTournamentSelectionSaver({
	userName,
	enableAutoSave = true,
}: UseTournamentSelectionSaverProps) {
	const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const lastSavedRef = useRef<string>("");

	const scheduleSave = useCallback(
		(selectedNames: NameItem[]) => {
			if (!userName || !enableAutoSave) {
				return;
			}

			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}

			const selectionHash = selectedNames
				.map((n) => n.id)
				.sort()
				.join(",");
			if (selectionHash === lastSavedRef.current) {
				return;
			}

			saveTimeoutRef.current = setTimeout(async () => {
				try {
					localStorage.setItem(
						`tournament_selection_${userName}`,
						JSON.stringify(selectedNames.map((n) => n.id)),
					);
					lastSavedRef.current = selectionHash;
				} catch (error) {
					console.error("Failed to save tournament selection:", error);
				}
			}, 1000);
		},
		[userName, enableAutoSave],
	);

	const loadSavedSelection = useCallback(() => {
		if (!userName) {
			return [];
		}
		try {
			const saved = localStorage.getItem(`tournament_selection_${userName}`);
			return saved ? JSON.parse(saved) : [];
		} catch {
			return [];
		}
	}, [userName]);

	return {
		scheduleSave,
		loadSavedSelection,
	};
}

/* =========================================================================
   TOURNAMENT HANDLERS HOOK
   ========================================================================= */

export function useTournamentHandlers({
	userName,
	tournamentActions,
}: Omit<UseTournamentHandlersProps, "navigateTo">) {
	const handleTournamentComplete = useCallback(
		async (finalRatings: Record<string, { rating: number; wins?: number; losses?: number }>) => {
			try {
				devLog("[App] handleTournamentComplete called with:", finalRatings);

				if (!userName) {
					throw new Error("No user name available for saving results");
				}

				const ratingsArray = ratingsToArray(finalRatings);
				const updatedRatings = ratingsToObject(ratingsArray);

				devLog("[App] Ratings to save:", ratingsArray);

				const saveResult = await tournamentsAPI.saveTournamentRatings(userName, ratingsArray);

				devLog("[App] Save ratings result:", saveResult);

				if (!saveResult.success) {
					devWarn(
						"[App] Failed to save ratings to database:",
						(saveResult as { error?: string }).error,
					);
				}

				tournamentActions.setRatings(updatedRatings);
				tournamentActions.setComplete(true);

				devLog("[App] Tournament marked as complete, scrolling to analysis");

				const analyzeElement = document.getElementById("analysis");
				if (analyzeElement) {
					analyzeElement.scrollIntoView({ behavior: "smooth" });
				}
			} catch (error) {
				devError("[App] Error in handleTournamentComplete:", error);
				ErrorManager.handleError(error, "Tournament Completion", {
					isRetryable: true,
					affectsUserData: true,
					isCritical: false,
				});
			}
		},
		[userName, tournamentActions],
	);

	const handleStartNewTournament = useCallback(() => {
		tournamentActions.resetTournament();
	}, [tournamentActions]);

	const handleTournamentSetup = useCallback(
		(names: NameItem[] | undefined) => {
			clearTournamentCache();

			tournamentActions.resetTournament();
			tournamentActions.setLoading(true);

			const processedNames = Array.isArray(names)
				? names.filter((name) => !isNameHidden(name))
				: [];

			if (processedNames.length === 0) {
				devWarn("[App] No visible names available after filtering hidden names");
				tournamentActions.setLoading(false);
				return;
			}

			tournamentActions.setNames(processedNames);

			setTimeout(() => {
				tournamentActions.setLoading(false);
			}, 100);
		},
		[tournamentActions],
	);

	const handleUpdateRatings = useCallback(
		async (adjustedRatings: Record<string, { rating: number; wins?: number; losses?: number }>) => {
			try {
				const ratingsArray = ratingsToArray(adjustedRatings);

				if (userName) {
					const saveResult = await tournamentsAPI.saveTournamentRatings(userName, ratingsArray);

					if (saveResult.success) {
						devLog("[App] Update ratings result:", saveResult);
					} else {
						devWarn("[App] Failed to auto-save ratings:", (saveResult as { error?: string }).error);
					}
				}

				const updatedRatings = ratingsToObject(ratingsArray);

				tournamentActions.setRatings(updatedRatings);
				return true;
			} catch (error) {
				devError("[App] Error in handleUpdateRatings:", error);
				ErrorManager.handleError(error, "Rating Update", {
					isRetryable: true,
					affectsUserData: true,
					isCritical: false,
				});
				throw error;
			}
		},
		[tournamentActions, userName],
	);

	return {
		handleTournamentComplete,
		handleStartNewTournament,
		handleTournamentSetup,
		handleUpdateRatings,
	};
}

/* =========================================================================
   NAME MANAGEMENT VIEW HOOK
   ========================================================================= */

export function useNameManagementView({
	mode,
	userName,
	profileProps = {},
	tournamentProps = {},
	analysisMode,
	setAnalysisMode,
	extensions = {},
}: UseNameManagementViewProps): UseNameManagementViewResult {
	const {
		names,
		isLoading,
		error: dataError,
		refetch,
		setNames,
	} = useNameData({ userName: userName ?? null, mode });

	const {
		selectedNames,
		selectedIds,
		toggleName,
		toggleNameById,
		toggleNamesByIds,
		selectAll: _selectAll,
		selectedCount,
		clearSelection,
		isSelected,
	} = useNameSelection({
		names,
		mode,
		userName: userName ?? null,
	});

	const { errors, ui, errorActions, tournamentActions, tournament } = useAppStore();

	useEffect(() => {
		if (mode === "tournament" && tournamentActions?.setSelection) {
			const currentStoreSelection = tournament.selectedNames || [];
			const hasChanged =
				selectedNames.length !== currentStoreSelection.length ||
				selectedNames.some((n: NameItem, i: number) => n.id !== currentStoreSelection[i]?.id);

			if (hasChanged) {
				tournamentActions.setSelection(selectedNames);
			}
		}
	}, [selectedNames, tournamentActions, mode, tournament.selectedNames]);

	const isError = mode === "tournament" && (!!errors.current || !!dataError);
	const clearErrors =
		errorActions?.clearError ??
		(() => {
			// Intentional no-op: fallback when errorActions not available
		});

	const [showSelectedOnly, setShowSelectedOnly] = useState(false);

	const { isSwipeMode, showCatPictures } = ui;

	const [filterStatus, setFilterStatus] = useState(FILTER_OPTIONS.VISIBILITY.VISIBLE);
	const [localUserFilter, setLocalUserFilter] = useState("all");
	const userFilter = (profileProps.userFilter as "all" | "user" | "other") ?? localUserFilter;
	const setUserFilter =
		(profileProps.setUserFilter as React.Dispatch<
			React.SetStateAction<"all" | "user" | "other">
		>) ?? setLocalUserFilter;
	const [selectionFilter, setSelectionFilter] = useState<"all" | "selected" | "unselected">("all");
	const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
	const [activeTab, setActiveTab] = useState("manage");
	const [searchTerm, setSearchTerm] = useState("");

	const navigate = useNavigate();
	const location = useLocation();

	const handleAnalysisModeToggle = useCallback(() => {
		const newValue = !analysisMode;
		setAnalysisMode(newValue);

		const currentPath = location.pathname;
		const currentSearch = new URLSearchParams(location.search);

		if (newValue) {
			currentSearch.set("analysis", "true");
		} else {
			currentSearch.delete("analysis");
		}

		const newSearch = currentSearch.toString();
		const newUrl = newSearch ? `${currentPath}?${newSearch}` : currentPath;
		navigate(newUrl);
	}, [navigate, setAnalysisMode, analysisMode, location]);

	const filteredNamesForSwipe = useMemo(() => {
		if (mode !== "tournament") {
			return [];
		}
		const activeFilterStatus = analysisMode ? filterStatus : "visible";
		const activeVisibility = mapFilterStatusToVisibility(activeFilterStatus);

		let result = applyNameFilters(names, {
			visibility: activeVisibility,
			isAdmin: Boolean(profileProps.isAdmin),
		});

		if (searchTerm.trim()) {
			const normalizedSearch = searchTerm.trim().toLowerCase();
			result = result.filter((name) => {
				const content = `${name.name ?? ""} ${name.description ?? ""}`.toLowerCase();
				return content.includes(normalizedSearch);
			});
		}

		if (showSelectedOnly) {
			result = result.filter((name) => selectedNames.some((s: NameItem) => s.id === name.id));
		}

		return result;
	}, [
		names,
		mode,
		analysisMode,
		filterStatus,
		profileProps.isAdmin,
		searchTerm,
		showSelectedOnly,
		selectedNames,
	]);

	const filteredNames = useMemo(() => {
		const activeFilterStatus = mode === "tournament" && !analysisMode ? "visible" : filterStatus;
		const activeVisibility = mapFilterStatusToVisibility(activeFilterStatus);

		let result = applyNameFilters(names, {
			visibility: activeVisibility,
			isAdmin: Boolean(profileProps.isAdmin),
		});

		if (searchTerm.trim()) {
			const normalizedSearch = searchTerm.trim().toLowerCase();
			result = result.filter((name) => {
				const content = `${name.name ?? ""} ${name.description ?? ""}`.toLowerCase();
				return content.includes(normalizedSearch);
			});
		}

		if (selectionFilter !== "all") {
			if (selectionFilter === "selected") {
				result = result.filter((n) => isSelected(n));
			} else {
				result = result.filter((n) => !isSelected(n));
			}
		}

		return result;
	}, [
		names,
		mode,
		analysisMode,
		filterStatus,
		profileProps.isAdmin,
		selectionFilter,
		isSelected,
		searchTerm,
	]);

	const filterConfig: TournamentFilters = useMemo(() => {
		if (mode === "tournament" && analysisMode) {
			return {
				filterStatus: filterStatus as "all" | "visible" | "hidden",
				userFilter: userFilter as "all" | "user" | "other",
				selectionFilter: selectionFilter as "all" | "selected" | "unselected",
				dateFilter: dateFilter as "all" | "today" | "week" | "month",
				searchTerm,
			};
		} else if (mode === "tournament") {
			return {
				searchTerm,
			};
		} else {
			return {
				filterStatus: filterStatus as "all" | "visible" | "hidden",
				userFilter: userFilter as "all" | "user" | "other",
				selectionFilter: selectionFilter as "all" | "selected" | "unselected",
				searchTerm,
			};
		}
	}, [mode, filterStatus, userFilter, selectionFilter, dateFilter, analysisMode, searchTerm]);

	const handleFilterChange = useCallback(
		(name: keyof TournamentFilters, value: string | number | boolean) => {
			if (mode === "tournament" && analysisMode) {
				switch (name) {
					case "filterStatus":
						setFilterStatus(String(value));
						break;
					case "userFilter":
						setUserFilter(String(value) as "all" | "user" | "other");
						break;
					case "selectionFilter":
						setSelectionFilter(String(value) as "all" | "selected" | "unselected");
						break;
					case "dateFilter":
						setDateFilter((String(value) as "all" | "today" | "week" | "month") || "all");
						break;
					case "searchTerm":
						setSearchTerm(String(value));
						break;
				}
			} else if (mode === "tournament") {
				// No filters for basic tournament mode
			} else {
				switch (name) {
					case "filterStatus":
						setFilterStatus(String(value));
						break;
					case "userFilter":
						setUserFilter(String(value) as "all" | "user" | "other");
						break;
					case "selectionFilter":
						setSelectionFilter(String(value) as "all" | "selected" | "unselected");
						break;
					case "searchTerm":
						setSearchTerm(String(value));
						break;
				}
			}
		},
		[mode, analysisMode, setUserFilter],
	);

	const stats = useMemo(
		() => ({
			total: names.length,
			visible: filteredNames.length,
			hidden: names.filter((n: NameItem) => n.is_hidden).length,
			selected: selectedCount,
		}),
		[names.length, filteredNames.length, selectedCount, names],
	);

	return {
		names,
		isLoading,
		isError,
		error: isError ? (dataError as Error) : null,
		dataError: dataError as Error | null,
		refetch,
		clearErrors,
		setNames,
		setHiddenIds: (ids: Set<string | number>) => {
			setNames((prev: NameItem[]) =>
				prev.map((n: NameItem) => ({
					...n,
					is_hidden: ids.has(n.id),
					isHidden: ids.has(n.id),
				})),
			);
		},

		selectedNames,
		selectedIds,
		isSelectionMode: false,
		setIsSelectionMode: () => {
			// Intentional no-op: selection mode not used in this context
		},
		toggleName,
		toggleNameById,
		toggleNamesByIds,
		clearSelection,
		selectAll: _selectAll,
		isSelected,
		selectedCount,

		filterStatus,
		setFilterStatus,
		showSelectedOnly,
		setShowSelectedOnly,
		selectionFilter,
		setSelectionFilter,
		userFilter,
		setUserFilter,
		dateFilter,
		setDateFilter,
		searchTerm,
		setSearchTerm,

		isSwipeMode,
		showCatPictures,

		activeTab,
		setActiveTab,

		filteredNames,
		filteredNamesForSwipe,
		stats,
		filterConfig,
		handleFilterChange,
		handleAnalysisModeToggle,

		profileProps,
		tournamentProps,
		analysisMode,
		setAnalysisMode,
		sortedNames: filteredNames,
		extensions,
	};
}

/* =========================================================================
   CORE TOURNAMENT HOOK
   ========================================================================= */

export function useTournament({
	names = [],
	existingRatings = {},
	onComplete,
}: UseTournamentProps = {}) {
	const elo = useMemo(() => new EloRating(), []);
	const userName = useAppStore((state) => state.user.name);
	const tournament = useAppStore((state) => state.tournament);
	const { ratings: currentRatings } = tournament;
	const { tournamentActions } = useAppStore();

	const tournamentId = useMemo(() => {
		const sortedNames = [...names]
			.map((n: NameItem) => n.name || n)
			.sort()
			.join("-");
		const prefix = userName || "anonymous";
		return `tournament-${prefix}-${sortedNames}`;
	}, [names, userName]);

	const defaultPersistentState = useMemo(() => createDefaultPersistentState(userName), [userName]);

	const [persistentStateRaw, setPersistentState] = useLocalStorage<PersistentState>(
		tournamentId,
		defaultPersistentState,
	);

	const persistentState = useMemo(() => {
		if (
			!persistentStateRaw ||
			typeof persistentStateRaw !== "object" ||
			Array.isArray(persistentStateRaw)
		) {
			return createDefaultPersistentState(userName);
		}
		return {
			...createDefaultPersistentState(userName),
			...persistentStateRaw,
			matchHistory: Array.isArray(persistentStateRaw.matchHistory)
				? persistentStateRaw.matchHistory
				: [],
		};
	}, [persistentStateRaw, userName]);

	const updatePersistentState = useCallback(
		(updates: Partial<PersistentState> | ((prev: PersistentState) => Partial<PersistentState>)) => {
			setPersistentState((prev: PersistentState) => {
				const delta = typeof updates === "function" ? updates(prev) || {} : updates || {};
				return {
					...prev,
					...delta,
					lastUpdated: Date.now(),
					userName: userName || "anonymous",
				};
			});
		},
		[setPersistentState, userName],
	);

	useEffect(() => {
		if (persistentState && persistentState.userName !== (userName || "anonymous")) {
			updatePersistentState({
				matchHistory: [],
				currentRound: 1,
				currentMatch: 1,
				totalMatches: 0,
				userName: userName || "anonymous",
				namesKey: "",
			});
		}
	}, [persistentState, updatePersistentState, userName]);

	const [tState, setTState] = useState<TournamentUIState>({
		currentMatch: null,
		isTransitioning: false,
		roundNumber: persistentState.currentRound || 1,
		currentMatchNumber: persistentState.currentMatch || 1,
		totalMatches: persistentState.totalMatches || 0,
		canUndo: persistentState.matchHistory.length > 1,
		currentRatings: existingRatings,
		sorter: null,
		isError: !Array.isArray(names) || (names.length > 0 && names.length < 2),
	});

	const updateTournamentState = useCallback(
		(
			updates:
				| Partial<TournamentUIState>
				| ((prev: TournamentUIState) => Partial<TournamentUIState>),
		) => {
			setTState((prev) => {
				const delta = typeof updates === "function" ? updates(prev) : updates;
				return { ...prev, ...delta };
			});
		},
		[],
	);

	const lastInitKeyRef = useRef("");

	useEffect(() => {
		if (!Array.isArray(names) || names.length < 2) {
			return;
		}

		const namesKey = names
			.map((n) => n?.id || n?.name || "")
			.filter(Boolean)
			.sort()
			.join(",");
		if (lastInitKeyRef.current === namesKey) {
			return;
		}

		lastInitKeyRef.current = namesKey;
		const nameStrings = names.map((n) => n?.name || "").filter(Boolean);
		const newSorter = new PreferenceSorter(nameStrings);
		const estimatedMatches = names.length > 1 ? names.length - 1 : 0;

		updateTournamentState({
			sorter: newSorter,
			totalMatches: estimatedMatches,
			currentMatchNumber: 1,
			roundNumber: 1,
			canUndo: false,
			currentRatings: existingRatings,
		});

		updatePersistentState({
			matchHistory: [],
			currentRound: 1,
			currentMatch: 1,
			totalMatches: estimatedMatches,
			namesKey,
		});

		const first = getNextMatch(names, newSorter, 1, {
			currentRatings: existingRatings,
			history: [],
		});
		if (first) {
			updateTournamentState({ currentMatch: first });
		} else if (names.length >= 2) {
			const left = names[0];
			const right = names[1];
			if (left && right) {
				updateTournamentState({
					currentMatch: { left, right },
				});
			}
		}
	}, [names, existingRatings, updateTournamentState, updatePersistentState]);

	const getCurrentRatings = useCallback(() => {
		if (!names || names.length === 0) {
			return [];
		}
		return names
			.map((name: NameItem) => {
				const nameStr = name.name;
				const rating = currentRatings?.[nameStr] || {
					rating: 1500,
					wins: 0,
					losses: 0,
				};
				return {
					name: nameStr,
					id: String(name?.id || nameStr),
					rating: typeof rating === "number" ? rating : rating.rating || 1500,
					wins: rating.wins || 0,
					losses: rating.losses || 0,
				};
			})
			.sort((a: TournamentResult, b: TournamentResult) => b.rating - a.rating);
	}, [names, currentRatings]);

	const handleVote = useCallback(
		async (
			option: "left" | "right" | "both" | "neither",
		): Promise<Record<string, { rating: number; wins?: number; losses?: number }> | undefined> => {
			if (tState.isTransitioning || tState.isError || !tState.currentMatch) {
				return undefined;
			}

			updateTournamentState({ isTransitioning: true });

			const leftName =
				(tState.currentMatch.left as NameItem)?.name || (tState.currentMatch.left as string);
			const rightName =
				(tState.currentMatch.right as NameItem)?.name || (tState.currentMatch.right as string);

			let winnerName: string | null = null;
			let loserName: string | null = null;

			if (option === "left") {
				winnerName = leftName;
				loserName = rightName;
			} else if (option === "right") {
				winnerName = rightName;
				loserName = leftName;
			}

			const currentStoreRatings = useAppStore.getState().tournament.ratings;
			const newRatings = { ...currentStoreRatings };

			if (elo) {
				const leftRating = newRatings[leftName]?.rating || 1500;
				const rightRating = newRatings[rightName]?.rating || 1500;
				const leftStats = {
					winsA: newRatings[leftName]?.wins || 0,
					lossesA: newRatings[leftName]?.losses || 0,
				};
				const rightStats = {
					winsB: newRatings[rightName]?.wins || 0,
					lossesB: newRatings[rightName]?.losses || 0,
				};

				const outcome: string =
					option === "both"
						? "both"
						: option === "neither"
							? "none"
							: option === "left"
								? "left"
								: "right";

				const r = elo.calculateNewRatings(leftRating, rightRating, outcome, {
					...leftStats,
					...rightStats,
				});

				newRatings[leftName] = {
					...newRatings[leftName],
					rating: r.newRatingA,
					wins: r.winsA,
					losses: r.lossesA,
				};
				newRatings[rightName] = {
					...newRatings[rightName],
					rating: r.newRatingB,
					wins: r.winsB,
					losses: r.lossesB,
				};
			}

			if (tState.sorter) {
				const s = tState.sorter as PreferenceSorter;
				if (winnerName && loserName) {
					if (typeof s.addPreference === "function") {
						s.addPreference(winnerName, loserName, 1);
					} else if (s.preferences instanceof Map) {
						s.preferences.set(`${winnerName}-${loserName}`, 1);
					}
				} else if (option === "both" || option === "neither") {
					if (typeof s.addPreference === "function") {
						s.addPreference(leftName, rightName, 0);
						s.addPreference(rightName, leftName, 0);
					} else if (s.preferences instanceof Map) {
						s.preferences.set(`${leftName}-${rightName}`, 0);
						s.preferences.set(`${rightName}-${leftName}`, 0);
					}
				}
			}

			const matchRecord: MatchRecord = {
				match: tState.currentMatch,
				winner: winnerName,
				loser: loserName,
				voteType: option,
				matchNumber: tState.currentMatchNumber,
				roundNumber: tState.roundNumber,
				timestamp: Date.now(),
			};

			const nextMatchNumber = tState.currentMatchNumber + 1;
			updatePersistentState({
				matchHistory: [...(persistentState.matchHistory || []), matchRecord],
				currentMatch: nextMatchNumber,
			});

			if (tournamentActions?.setRatings) {
				tournamentActions.setRatings(newRatings);
			}
			updateTournamentState({ currentRatings: newRatings, canUndo: true });

			if (nextMatchNumber > tState.totalMatches) {
				setTimeout(() => {
					updateTournamentState({ isTransitioning: false });
					if (onComplete) {
						onComplete(getCurrentRatings());
					}
				}, 300);
				return newRatings;
			}

			const nextMatch = getNextMatch(names, tState.sorter, nextMatchNumber, {
				currentRatings: newRatings,
				history: [...(persistentState.matchHistory || []), matchRecord],
			});

			const newRoundNumber = calculateBracketRound(names.length, nextMatchNumber);
			setTimeout(() => {
				updateTournamentState({
					currentMatch: nextMatch || null,
					currentMatchNumber: nextMatchNumber,
					roundNumber: newRoundNumber,
					isTransitioning: false,
				});
				if (newRoundNumber !== tState.roundNumber) {
					updatePersistentState({ currentRound: newRoundNumber });
				}
			}, 300);

			return newRatings;
		},
		[
			tState,
			elo,
			tournamentActions,
			updatePersistentState,
			updateTournamentState,
			names,
			onComplete,
			getCurrentRatings,
			persistentState.matchHistory,
		],
	);

	const handleUndo = useCallback(() => {
		if (tState.isTransitioning || !tState.canUndo || persistentState.matchHistory.length === 0) {
			return;
		}

		updateTournamentState({ isTransitioning: true });
		const history = persistentState.matchHistory;
		const lastVote = history[history.length - 1];
		if (!lastVote || !lastVote.match) {
			updateTournamentState({ isTransitioning: false });
			return;
		}

		updateTournamentState({
			currentMatch: lastVote.match,
			currentMatchNumber: lastVote.matchNumber || 1,
		});

		const newHistory = history.slice(0, -1);
		updatePersistentState({ matchHistory: newHistory });

		const s = tState.sorter as PreferenceSorter;
		if (s) {
			if (typeof s.undoLastPreference === "function") {
				s.undoLastPreference();
			} else if (s.preferences instanceof Map) {
				const ln = (lastVote.match.left as NameItem)?.name || (lastVote.match.left as string);
				const rn = (lastVote.match.right as NameItem)?.name || (lastVote.match.right as string);
				if (ln && rn) {
					s.preferences.delete(`${ln}-${rn}`);
					s.preferences.delete(`${rn}-${ln}`);
					if (typeof s.currentIndex === "number") {
						s.currentIndex = Math.max(0, s.currentIndex - 1);
					}
				}
			}
		}

		if (names.length >= 2 && newHistory.length > 0) {
			const prevMatchNumber =
				newHistory[newHistory.length - 1]?.matchNumber || tState.currentMatchNumber;
			const calcRound = calculateBracketRound(names.length, prevMatchNumber);
			if (calcRound !== tState.roundNumber) {
				updateTournamentState({ roundNumber: calcRound });
				updatePersistentState({ currentRound: calcRound });
			}
		} else if (newHistory.length === 0) {
			updateTournamentState({ roundNumber: 1 });
			updatePersistentState({ currentRound: 1 });
		}

		updateTournamentState({ canUndo: newHistory.length > 0 });
		setTimeout(() => updateTournamentState({ isTransitioning: false }), 500);
	}, [
		tState,
		persistentState.matchHistory,
		updateTournamentState,
		updatePersistentState,
		names.length,
	]);

	const progressValue = useMemo(() => {
		if (!tState.totalMatches) {
			return 0;
		}
		return Math.round((tState.currentMatchNumber / tState.totalMatches) * 100);
	}, [tState.currentMatchNumber, tState.totalMatches]);

	if (tState.isError) {
		return {
			currentMatch: null,
			handleVote: async () => undefined,
			progress: 0,
			roundNumber: 0,
			currentMatchNumber: 0,
			totalMatches: 0,
			matchHistory: [],
			getCurrentRatings: () => [],
			isError: true,
			userName: persistentState.userName,
		};
	}

	return {
		currentMatch: tState.currentMatch,
		isTransitioning: tState.isTransitioning,
		roundNumber: tState.roundNumber,
		currentMatchNumber: tState.currentMatchNumber,
		totalMatches: tState.totalMatches,
		progress: progressValue,
		handleVote,
		handleUndo,
		canUndo: tState.canUndo,
		getCurrentRatings,
		isError: tState.isError,
		matchHistory: persistentState.matchHistory,
		userName: persistentState.userName,
	};
}

/* =========================================================================
   TOURNAMENT VOTE HOOK
   ========================================================================= */

export function useTournamentVote({
	isProcessing,
	isTransitioning,
	isError,
	currentMatch,
	handleVote,
	onVote,
	audioManager,
	setIsProcessing,
	setIsTransitioning,
	setSelectedOption,
	setVotingError,
}: {
	isProcessing: boolean;
	isTransitioning: boolean;
	isError?: boolean;
	currentMatch: Match | null;
	handleVote: (
		option: "left" | "right" | "both" | "neither",
	) => Promise<Record<string, { rating: number; wins?: number; losses?: number }> | undefined>;
	onVote?: (data: {
		match: {
			left: {
				name: string;
				id: string | number | null;
				description: string;
				outcome: "win" | "loss";
			};
			right: {
				name: string;
				id: string | number | null;
				description: string;
				outcome: "win" | "loss";
			};
		};
		result: number;
		timestamp: string;
		ratings: Record<string, number>;
	}) => Promise<void> | void;
	audioManager: { playAudioTrack: () => void };
	setIsProcessing: (val: boolean) => void;
	setIsTransitioning: (val: boolean) => void;
	setSelectedOption: (val: "left" | "right" | "both" | "neither" | null) => void;
	setVotingError: (err: unknown) => void;
	setLastMatchResult?: (val: string | null) => void;
	setShowMatchResult?: (val: boolean) => void;
	showSuccess?: (val: string) => void;
	showError?: (val: string) => void;
}) {
	const lastVoteTimeRef = useRef(0);

	const handleVoteWithAnimation = useCallback(
		async (option: "left" | "right" | "both" | "neither") => {
			if (
				isProcessing ||
				isTransitioning ||
				isError ||
				Date.now() - lastVoteTimeRef.current < TOURNAMENT_TIMING.VOTE_COOLDOWN
			) {
				return;
			}
			lastVoteTimeRef.current = Date.now();
			try {
				setIsProcessing(true);
				setIsTransitioning(true);
				audioManager.playAudioTrack();

				const rawRatings = await handleVote(option);
				if (!rawRatings) {
					setIsProcessing(false);
					setIsTransitioning(false);
					return;
				}

				if (onVote && currentMatch) {
					await onVote({
						match: {
							left: {
								name:
									typeof currentMatch.left === "string"
										? currentMatch.left
										: currentMatch.left?.name || "",
								id: (typeof currentMatch.left !== "string" && currentMatch.left?.id) || null,
								description:
									(typeof currentMatch.left !== "string" && currentMatch.left?.description) || "",
								outcome: option === "left" || option === "both" ? "win" : "loss",
							},
							right: {
								name:
									typeof currentMatch.right === "string"
										? currentMatch.right
										: currentMatch.right?.name || "",
								id: (typeof currentMatch.right !== "string" && currentMatch.right?.id) || null,
								description:
									(typeof currentMatch.right !== "string" && currentMatch.right?.description) || "",
								outcome: option === "right" || option === "both" ? "win" : "loss",
							},
						},
						result: option === "left" ? -1 : option === "right" ? 1 : 0.5,
						ratings: Object.fromEntries(
							Object.entries(rawRatings).map(([name, data]) => [name, data.rating]),
						),
						timestamp: new Date().toISOString(),
					});
				}

				setSelectedOption(null);
				setTimeout(() => {
					setIsProcessing(false);
					setIsTransitioning(false);
				}, 800);
			} catch (e) {
				setIsProcessing(false);
				setIsTransitioning(false);
				setVotingError(e);
			}
		},
		[
			isProcessing,
			isTransitioning,
			isError,
			handleVote,
			audioManager,
			onVote,
			currentMatch,
			setIsProcessing,
			setIsTransitioning,
			setSelectedOption,
			setVotingError,
		],
	);

	return { handleVoteWithAnimation };
}

/* =========================================================================
   TOURNAMENT STATE HOOK
   ========================================================================= */

export function useTournamentState(
	names: NameItem[] | null | undefined,
	existingRatings:
		| Record<string, number | { rating: number; wins?: number; losses?: number }>
		| null
		| undefined,
	onComplete: (ratings: Record<string, { rating: number; wins?: number; losses?: number }>) => void,
	_onVote?: unknown,
) {
	const [randomizedNames, setRandomizedNames] = useState<NameItem[]>([]);
	const [selectedOption, setSelectedOption] = useState<
		"left" | "right" | "both" | "neither" | null
	>(null);
	const [isTransitioning, setIsTransitioning] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [lastMatchResult, setLastMatchResult] = useState<string | null>(null);
	const [showMatchResult, setShowMatchResult] = useState(false);

	const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
	const [showRoundTransition, setShowRoundTransition] = useState(false);
	const [nextRoundNumber, setNextRoundNumber] = useState<number | null>(null);
	const [votingError, setVotingError] = useState<unknown>(null);

	const namesIdentity = useMemo(
		() => (Array.isArray(names) ? names.map((n) => n.id || n.name).join(",") : ""),
		[names],
	);

	useEffect(() => {
		if (Array.isArray(names) && names.length > 0) {
			setRandomizedNames((prev) => {
				const prevIds = Array.isArray(prev) ? prev.map((n) => n.id || n.name).join(",") : "";
				return prevIds === namesIdentity ? prev : shuffleArray([...names]);
			});
		}
	}, [names, namesIdentity]);

	const convertedRatings = useMemo(
		() =>
			existingRatings
				? Object.fromEntries(
						Object.entries(existingRatings).map(([key, value]) => [
							key,
							typeof value === "number" ? { rating: value } : value,
						]),
					)
				: {},
		[existingRatings],
	);

	const tournamentNames = useMemo(
		() =>
			randomizedNames.map((n) => ({
				id: String(n.id || n.name || ""),
				name: String(n.name || ""),
				description: n.description as string,
			})),
		[randomizedNames],
	);

	const tournament = useTournament({
		names: tournamentNames,
		existingRatings: convertedRatings as Record<
			string,
			{ rating: number; wins?: number; losses?: number }
		>,
		onComplete: (results) => {
			const ratings = Object.fromEntries(
				results.map((r) => [r.name, { rating: r.rating, wins: r.wins, losses: r.losses }]),
			);
			onComplete(ratings);
		},
	});

	useEffect(() => {
		if (tournament.roundNumber > 1) {
			setShowRoundTransition(true);
			setNextRoundNumber(tournament.roundNumber);
			const timer = setTimeout(() => {
				setShowRoundTransition(false);
				setNextRoundNumber(null);
			}, TOURNAMENT_TIMING.ROUND_TRANSITION_DELAY);
			return () => clearTimeout(timer);
		}
		return undefined;
	}, [tournament.roundNumber]);

	return {
		randomizedNames,
		selectedOption,
		setSelectedOption,
		isTransitioning,
		setIsTransitioning,
		isProcessing,
		setIsProcessing,
		lastMatchResult,
		setLastMatchResult,
		showMatchResult,
		setShowMatchResult,

		showKeyboardHelp,
		setShowKeyboardHelp,
		showRoundTransition,
		nextRoundNumber,
		votingError,
		setVotingError,

		handleVote: tournament.handleVote,
		tournament,
	};
}
