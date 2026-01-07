import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useAppStore from "../../../core/store/useAppStore";
import { useAdminStatus } from "../../../shared/hooks/useAppHooks";
import type { NameItem } from "../../../types/components";
import { useProfile } from "../../profile/hooks/useProfile";
import { useProfileNotifications } from "../../profile/hooks/useProfileNotifications";
import { useImageGallery } from "./useImageGallery";

interface TournamentControllerProps {
	userName: string;
	onNameChange?: (name: string) => void;
	enableAnalysisMode?: boolean;
}

export function useTournamentController({
	userName,
	onNameChange,
	enableAnalysisMode,
}: TournamentControllerProps) {
	// * Store state
	const currentView = useAppStore((state) => state.tournament.currentView);

	// * Identity state
	const [isEditingName, setIsEditingName] = useState(false);
	const [tempName, setTempName] = useState(userName);

	// * Sync temp name when userName prop changes
	useEffect(() => {
		setTempName(userName);
	}, [userName]);

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

	// * Gallery state
	const [showAllPhotos, setShowAllPhotos] = useState(false);
	const [lightboxOpen, setLightboxOpen] = useState(false);
	const [lightboxIndex, setLightboxIndex] = useState(0);

	const { galleryImages, addImages } = useImageGallery({
		isLightboxOpen: lightboxOpen,
	});
	const { isAdmin } = useAdminStatus(userName);

	// * Notifications
	const { showSuccess, showError, showToast, ToastContainer } = useProfileNotifications();

	// * Profile & Analysis
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

	// * Analysis mode check
	const shouldEnableAnalysisMode = useMemo(() => {
		if (typeof window === "undefined") {
			return !!enableAnalysisMode;
		}
		const urlParams = new URLSearchParams(window.location.search);
		return !!enableAnalysisMode || urlParams.get("analysis") === "true";
	}, [enableAnalysisMode]);

	// * Handlers Ref
	const handlersRef = useRef<{
		handleToggleVisibility: ((nameId: string) => Promise<void>) | undefined;
		handleDelete: ((name: NameItem) => Promise<void>) | undefined;
	}>({
		handleToggleVisibility: undefined,
		handleDelete: undefined,
	});

	// * Lightbox handlers
	const handleImageOpen = useCallback(
		(image: string) => {
			if (!galleryImages) {
				return;
			}
			const idx = galleryImages.indexOf(image);
			if (idx !== -1) {
				setLightboxIndex(idx);
				setLightboxOpen(true);
			}
		},
		[galleryImages],
	);

	const handleImagesUploaded = useCallback(
		(uploaded: string[]) => {
			addImages(uploaded);
		},
		[addImages],
	);

	const handleLightboxNavigate = useCallback((newIndex: number) => {
		setLightboxIndex(newIndex);
	}, []);

	const handleLightboxClose = useCallback(() => {
		setLightboxOpen(false);
	}, []);

	const preloadImages = useMemo(() => {
		if (!lightboxOpen || !galleryImages || galleryImages.length === 0) {
			return [];
		}
		const prevIndex = lightboxIndex === 0 ? galleryImages.length - 1 : lightboxIndex - 1;
		const nextIndex = lightboxIndex === galleryImages.length - 1 ? 0 : lightboxIndex + 1;
		return [galleryImages[prevIndex], galleryImages[nextIndex]];
	}, [lightboxOpen, lightboxIndex, galleryImages]);

	return {
		// States
		currentView,
		isEditingName,
		tempName,
		setTempName,
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

		// Refs/Components
		handlersRef,
		// biome-ignore lint/style/useNamingConvention: Component reference, PascalCase is appropriate
		ToastContainer,
	};
}
