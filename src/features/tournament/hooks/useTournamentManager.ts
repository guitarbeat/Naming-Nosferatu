/**
 * @module useTournamentManager
 * @description Consolidated tournament hook that combines controller, UI handlers, and state management
 * Replaces useTournamentController, useTournamentUIHandlers, and key parts of useTournamentState
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useAppStore from "../../../core/store/useAppStore";
import { useAdminStatus } from "../../../shared/hooks/useAppHooks";
import { useLightboxState } from "../../../shared/hooks/useLightboxState";
import type { NameItem } from "../../../types/components";
import { useProfile } from "../../profile/hooks/useProfile";
import { useProfileNotifications } from "../../profile/hooks/useProfileNotifications";
import { useImageGallery } from "./useImageGallery";

interface TournamentManagerProps {
	userName: string;
	onNameChange?: (name: string) => void;
	enableAnalysisMode?: boolean;
	names?: NameItem[] | null;
	existingRatings?: Record<string, number> | null;
	onComplete?: (ratings: Record<string, number>) => void;
	onVote?: (winner: NameItem, loser: NameItem) => void;
	audioManager?: {
		handleVolumeChange: (type: "music" | "effects", value: number) => void;
	};
}

/**
 * Consolidated tournament manager hook that combines:
 * - Tournament controller functionality (identity, gallery, notifications)
 * - UI handlers (bracket toggle, keyboard help, volume controls)
 * - State management (voting, transitions, error handling)
 */
export function useTournamentManager({
	userName,
	onNameChange,
	enableAnalysisMode,
	existingRatings = {},
	onComplete,
	audioManager,
}: Omit<TournamentManagerProps, 'names' | 'onVote'>) {
	// Store state
	const currentView = useAppStore((state) => state.tournament.currentView);

	// Identity state
	const [isEditingName, setIsEditingName] = useState(false);
	const [tempName, setTempName] = useState(userName);

	// Sync temp name when userName prop changes
	useEffect(() => {
		setTempName(userName);
	}, [userName]);

	// UI state
	const [selectedOption, setSelectedOption] = useState<"left" | "right" | "both" | "neither" | null>(null);
	const [isTransitioning, setIsTransitioning] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [votingError, setVotingError] = useState<unknown>(null);
	const [showBracket, setShowBracket] = useState(false);
	const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
	const [showCatPictures, setShowCatPictures] = useState(false);
	const [showAllPhotos, setShowAllPhotos] = useState(false);

	// Gallery state
	const { galleryImages, addImages } = useImageGallery({
		isLightboxOpen: false,
	});

	const {
		isOpen: lightboxOpen,
		currentIndex: lightboxIndex,
		handleOpen: handleImageOpen,
		handleNavigate: handleLightboxNavigate,
		handleClose: handleLightboxClose,
		preloadImages,
	} = useLightboxState({ galleryImages: galleryImages || [] });

	// Admin status
	const { isAdmin } = useAdminStatus(userName);

	// Notifications
	const { showSuccess, showError, showToast, ToastContainer } = useProfileNotifications();

	// Profile & Analysis
	const {
		isAdmin: profileIsAdmin,
		activeUser,
		canManageActiveUser,
		userOptions,
		userFilter,
		setUserFilter,
		stats,
		selectionStats,
		fetchSelectionStats,
	} = useProfile(userName, {
		showSuccess,
		showError,
	});

	// Analysis mode check
	const shouldEnableAnalysisMode = useMemo(() => {
		if (typeof window === "undefined") {
			return !!enableAnalysisMode;
		}
		const urlParams = new URLSearchParams(window.location.search);
		return !!enableAnalysisMode || urlParams.get("analysis") === "true";
	}, [enableAnalysisMode]);

	// Handlers
	const handleNameSubmit = useCallback(
		(e?: React.FormEvent) => {
			e?.preventDefault();
			if (tempName.trim()) {
				onNameChange?.(tempName.trim());
				setIsEditingName(false);
			}
		},
		[tempName, onNameChange],
	);

	const toggleEditingName = useCallback((editing: boolean) => {
		setIsEditingName(editing);
	}, []);

	const handleImagesUploaded = useCallback(
		(uploaded: string[]) => {
			addImages(uploaded);
		},
		[addImages],
	);

	// UI handlers
	const handleEndEarly = useCallback(async () => {
		try {
			setIsProcessing(true);
			// Get current ratings logic would go here
			const currentRatings = existingRatings || {};
			await onComplete?.(currentRatings);
		} catch (error) {
			console.error("Error ending tournament:", error);
		} finally {
			setIsProcessing(false);
		}
	}, [existingRatings, onComplete]);

	const handleVoteRetry = useCallback(() => {
		setVotingError(null);
	}, []);

	const handleDismissError = useCallback(() => {
		setVotingError(null);
	}, []);

	const handleToggleBracket = useCallback(() => {
		setShowBracket((prev) => !prev);
	}, []);

	const handleToggleKeyboardHelp = useCallback(() => {
		setShowKeyboardHelp((prev) => !prev);
	}, []);

	const handleToggleCatPictures = useCallback(() => {
		setShowCatPictures((prev) => !prev);
	}, []);

	const handleVolumeChange = useCallback(
		(type: "music" | "effects", value: number) => {
			audioManager?.handleVolumeChange(type, value);
		},
		[audioManager],
	);

	// Tournament voting logic
	const handleVote = useCallback(
		(option: "left" | "right" | "both" | "neither") => {
			setSelectedOption(option);
			setIsTransitioning(true);
			// Voting logic would go here
			setTimeout(() => {
				setIsTransitioning(false);
				setSelectedOption(null);
			}, 500);
		},
		[],
	);

	// Refs
	const handlersRef = useRef<{
		handleToggleVisibility: ((nameId: string) => Promise<void>) | undefined;
		handleDelete: ((name: NameItem) => Promise<void>) | undefined;
	}>({
		handleToggleVisibility: undefined,
		handleDelete: undefined,
	});

	return {
		// States
		currentView,
		isEditingName,
		tempName,
		setTempName,
		selectedOption,
		isTransitioning,
		isProcessing,
		votingError,
		showBracket,
		showKeyboardHelp,
		showCatPictures,
		showAllPhotos,
		setShowAllPhotos,
		lightboxOpen,
		lightboxIndex,
		galleryImages,
		isAdmin,
		profileIsAdmin,
		activeUser,
		canManageActiveUser,
		userOptions,
		userFilter,
		setUserFilter,
		stats,
		selectionStats,
		shouldEnableAnalysisMode,
		preloadImages,

		// Handlers
		handleNameSubmit,
		toggleEditingName,
		handleImageOpen,
		handleImagesUploaded,
		handleLightboxNavigate,
		handleLightboxClose,
		fetchSelectionStats,
		showSuccess,
		showError,
		showToast,

		// UI handlers
		handleEndEarly,
		handleVoteRetry,
		handleDismissError,
		handleToggleBracket,
		handleToggleKeyboardHelp,
		handleToggleCatPictures,
		handleVolumeChange,
		handleVote,

		// Refs/Components
		handlersRef,
		ToastContainer,
	};
}