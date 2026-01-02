/**
 * @module TournamentSetup
 * @description Tournament setup wizard for selecting cat names and starting a tournament.
 * Thin wrapper around NameManagementView with tournament-specific layout and extensions.
 */
import { useMemo } from "react";
import Error from "../../shared/components/Error/Error";
import { NameManagementView } from "../../shared/components/NameManagementView/NameManagementView";
import { useCatFact } from "../auth/hooks/useCatFact";
import { AnalysisBulkActionsWrapper } from "./components/AnalysisBulkActionsWrapper";
import {
	AnalysisHandlersProvider,
	createAnalysisDashboardWrapper,
} from "./components/AnalysisWrappers";
import Lightbox from "./components/Lightbox";
import SwipeableNameCards from "./components/SwipeMode/SwipeableNameCards";
import { PhotoGallery } from "./components/TournamentSidebar/PhotoComponents";
import { useTournamentController } from "./hooks/useTournamentController";
import styles from "./TournamentSetup.module.css";
import identityStyles from "./TournamentSetupIdentity.module.css";

// * Error boundary component
const ErrorBoundary = Error;

interface TournamentSetupProps {
	onStart: (selectedNames: unknown) => void;
	userName?: string;
	enableAnalysisMode?: boolean;
	onOpenSuggestName?: () => void;
	onNameChange?: (name: string) => void;
	existingRatings?: Record<string, number>;
}

function TournamentSetupContent({
	onStart,
	userName = "",
	enableAnalysisMode = false,
	onOpenSuggestName,
	onNameChange,
	existingRatings: _existingRatings,
}: TournamentSetupProps) {
	const {
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
		handlersRef,
		ToastContainer,
	} = useTournamentController({
		userName,
		onNameChange,
		enableAnalysisMode,
	});

	const catFact = useCatFact();

	const photoGalleryProps = useMemo(
		() => ({
			galleryImages: galleryImages || [],
			showAllPhotos,
			onShowAllPhotosToggle: () => setShowAllPhotos((v) => !v),
			onImageOpen: handleImageOpen,
			isAdmin,
			userName,
			onImagesUploaded: handleImagesUploaded,
		}),
		[
			galleryImages,
			showAllPhotos,
			setShowAllPhotos,
			handleImageOpen,
			isAdmin,
			userName,
			handleImagesUploaded,
		],
	);

	const lightboxElement = lightboxOpen &&
		galleryImages &&
		galleryImages.length > 0 && (
			<Lightbox
				images={galleryImages}
				currentIndex={lightboxIndex}
				onClose={handleLightboxClose}
				onNavigate={handleLightboxNavigate}
				preloadImages={preloadImages}
			/>
		);

	if (currentView === "photos") {
		return (
			<>
				<ToastContainer />
				<div className={`${styles.container} ${styles.photosViewContainer}`}>
					<div className={styles.photosViewContent}>
						<h2 className={styles.photosViewTitle}>Photo Gallery</h2>
						<p className={styles.photosViewSubtitle}>
							Click any photo to view full size
						</p>
						<PhotoGallery {...photoGalleryProps} />
					</div>
				</div>
				{lightboxElement}
			</>
		);
	}

	return (
		<>
			<ToastContainer />
			<div className={styles.container}>
				{/* Name Identity Section */}
				<div className={identityStyles.identitySection}>
					<div className={identityStyles.identityLabel}>OPERATOR IDENTITY:</div>
					{isEditingName ? (
						<form
							onSubmit={handleNameSubmit}
							className={identityStyles.identityForm}
						>
							<input
								type="text"
								value={tempName}
								onChange={(e) => setTempName(e.target.value)}
								className={identityStyles.identityInput}
								autoFocus
								onKeyDown={(e) => {
									if (e.key === "Escape") {
										setTempName(userName);
										toggleEditingName(false);
									}
								}}
								onBlur={() => {
									if (!tempName.trim()) {
										setTempName(userName);
									}
									toggleEditingName(false);
								}}
								maxLength={30}
								aria-label="Edit operator name"
							/>
							<button type="submit" className={identityStyles.identitySaveBtn}>
								✓
							</button>
						</form>
					) : (
						<div className={identityStyles.identityDisplay}>
							<span className={identityStyles.identityName}>{userName}</span>
							<button
								className={identityStyles.identityEditBtn}
								onClick={() => toggleEditingName(true)}
								aria-label="Change Name"
							>
								[ EDIT ]
							</button>
						</div>
					)}
				</div>

				{/* Cat Fact Tape / System Feed */}
				<div className={identityStyles.catFactSection}>
					<div className={identityStyles.tapeDecorator} />
					<span className={identityStyles.tapeLabel}>SYSTEM_FEED:</span>
					<span className={identityStyles.tapeContent}>
						{catFact ? catFact.toUpperCase() : "SYNCING FELINE DATABASE..."}
					</span>
				</div>

				<NameManagementView
					mode="tournament"
					userName={userName}
					onStartTournament={onStart}
					onOpenSuggestName={onOpenSuggestName}
					tournamentProps={{
						SwipeableCards: SwipeableNameCards,
						isAdmin,
						imageList: galleryImages || [],
						gridClassName: styles.cardsContainer,
					}}
					profileProps={{
						isAdmin: canManageActiveUser,
						showUserFilter: profileIsAdmin,
						userOptions: userOptions ?? undefined,
						userFilter,
						setUserFilter,
						stats: stats
							? (stats as unknown as Record<string, unknown>)
							: undefined,
						selectionStats: selectionStats
							? (selectionStats as unknown as Record<string, unknown>)
							: undefined,
						onToggleVisibility: (nameId) =>
							handlersRef.current.handleToggleVisibility?.(nameId),
						onDelete: (name) => handlersRef.current.handleDelete?.(name),
					}}
					extensions={{
						dashboard: createAnalysisDashboardWrapper(
							stats,
							selectionStats,
							isAdmin,
							activeUser || undefined,
							undefined, // * Will use context.refetch() inside the wrapper component
						),
						bulkActions: (props: { onExport?: () => void }) => (
							<AnalysisBulkActionsWrapper
								activeUser={activeUser}
								canManageActiveUser={canManageActiveUser}
								isAdmin={isAdmin}
								fetchSelectionStats={fetchSelectionStats}
								showSuccess={showSuccess}
								showError={showError}
								showToast={showToast}
								{...props}
							/>
						),
						contextLogic: () => (
							<AnalysisHandlersProvider
								shouldEnableAnalysisMode={shouldEnableAnalysisMode}
								activeUser={activeUser}
								canManageActiveUser={canManageActiveUser}
								handlersRef={handlersRef}
								fetchSelectionStats={fetchSelectionStats}
								showSuccess={showSuccess}
								showError={showError}
								showToast={showToast}
							/>
						),
					}}
				/>
				{lightboxElement}
			</div>
		</>
	);
}

function TournamentSetup(props: TournamentSetupProps) {
	return (
		<ErrorBoundary variant="boundary">
			<TournamentSetupContent {...props} />
		</ErrorBoundary>
	);
}

TournamentSetup.displayName = "TournamentSetup";

export default TournamentSetup;
