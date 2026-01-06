/**
 * @module CombinedLoginTournamentSetup
 * @description Combined login and tournament setup component.
 * Shows login screen when not logged in, transitions to tournament setup after login.
 */
import { motion } from "framer-motion";
import { Dices } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { ErrorComponent as Error } from "../../shared/components/CommonUI";
import { NameManagementView } from "../../shared/components/NameManagementView/NameManagementView";
import {
	useCatFact,
	useEyeTracking,
	useLoginController,
} from "../auth/hooks/authHooks";
import loginStyles from "../auth/Login.module.css";
import {
	AnalysisBulkActionsWrapper,
	AnalysisHandlersProvider,
	createAnalysisDashboardWrapper,
} from "./components/AnalysisWrappers";
import Lightbox from "./components/Lightbox";
import SwipeableNameCards from "./components/SwipeMode/SwipeableNameCards";
import { PhotoGallery } from "./components/TournamentSidebar/PhotoComponents";
import { useTournamentController } from "./hooks/useTournamentController";
import styles from "./TournamentSetup.module.css";
import identityStyles from "./TournamentSetupIdentity.module.css";

const ErrorBoundary = Error;

interface CombinedLoginTournamentSetupProps {
	onLogin: (name: string) => Promise<boolean>;
	onStart: (selectedNames: unknown) => void;
	userName?: string;
	isLoggedIn: boolean;
	enableAnalysisMode?: boolean;
	onOpenSuggestName?: () => void;
	onNameChange?: (name: string) => void;
	existingRatings?: Record<string, number>;
}

function CombinedLoginTournamentSetupContent({
	onLogin,
	onStart,
	userName = "",
	isLoggedIn,
	enableAnalysisMode = false,
	onOpenSuggestName,
	onNameChange,
	existingRatings: _existingRatings,
}: CombinedLoginTournamentSetupProps) {
	const catRef = useRef<HTMLDivElement>(null);
	const [analysisMode, setAnalysisMode] = useState(enableAnalysisMode);

	// Login state and handlers
	const {
		name,
		isLoading: isLoginLoading,
		error: loginError,
		handleNameChange,
		handleSubmit: handleLoginSubmit,
		handleRandomName,
		handleKeyDown,
		catFact: loginCatFact,
	} = useLoginController(async (name: string): Promise<void> => {
		await onLogin(name);
	});

	// Track eye position for login screen
	const eyePosition = useEyeTracking({ catRef, catSvgRef: catRef });

	// Tournament setup state and handlers (only when logged in)
	const tournamentController = useTournamentController({
		userName: isLoggedIn ? userName : "",
		onNameChange,
		enableAnalysisMode,
	});

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
	} = tournamentController;

	const greeting = useMemo(() => {
		const hour = new Date().getHours();
		if (hour < 12) return "Good morning";
		if (hour < 18) return "Good afternoon";
		return "Good evening";
	}, []);

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

	// Show login screen when not logged in
	if (!isLoggedIn) {
		return (
			<div className={loginStyles.loginWrapper}>
				<div className={loginStyles.scene}>
					<div className={loginStyles.cutOutCat} ref={catRef}>
						<motion.div
							className={loginStyles.eye}
							animate={{ x: eyePosition.x, y: eyePosition.y }}
							transition={{ type: "spring", stiffness: 300, damping: 20 }}
						/>
						<motion.div
							className={`${loginStyles.eye} ${loginStyles.eyeRight}`}
							animate={{ x: eyePosition.x, y: eyePosition.y }}
							transition={{ type: "spring", stiffness: 300, damping: 20 }}
						/>
					</div>

					<div className={loginStyles.catFactTape}>
						{loginCatFact ? (
							<span>
								<strong>Fun Fact:</strong> {loginCatFact}
							</span>
						) : (
							"PREPARING FELINE WISDOM..."
						)}
					</div>

					<h1 className={loginStyles.title}>Welcome, Purr-spective Judge!</h1>
					<p className={loginStyles.subtitle}>
						{greeting}, please enter your name to begin the assessment.
					</p>

					<div className={loginStyles.inputTray}>
						<input
							type="text"
							className={loginStyles.loginInput}
							placeholder="YOUR NAME HERE..."
							value={name}
							onChange={handleNameChange}
							onKeyDown={handleKeyDown}
							disabled={isLoginLoading}
							autoFocus
							maxLength={30}
							aria-label="Enter your name to register as a judge"
						/>
					</div>

					{loginError && (
						<div className={loginStyles.error} role="alert">
							{loginError}
						</div>
					)}

					<motion.button
						className={loginStyles.leverBtn}
						onClick={handleLoginSubmit}
						disabled={isLoginLoading}
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
					>
						{isLoginLoading ? "PREPARING STAGE..." : "STEP INSIDE"}
					</motion.button>

					<motion.button
						className={loginStyles.rerollBtn}
						onClick={handleRandomName}
						disabled={isLoginLoading}
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						aria-label="Generate random name"
					>
						<Dices
							size={16}
							style={{
								display: "inline",
								marginRight: "6px",
								verticalAlign: "text-bottom",
							}}
						/>
						[ RE-ROLL IDENTITY 🎲 ]
					</motion.button>
				</div>
			</div>
		);
	}

	// Show tournament setup when logged in
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
								aria-label="Edit name"
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
					analysisMode={analysisMode}
					setAnalysisMode={setAnalysisMode}
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
							undefined,
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

function CombinedLoginTournamentSetup(
	props: CombinedLoginTournamentSetupProps,
) {
	return (
		<ErrorBoundary variant="boundary">
			<CombinedLoginTournamentSetupContent {...props} />
		</ErrorBoundary>
	);
}

CombinedLoginTournamentSetup.displayName = "CombinedLoginTournamentSetup";

export default CombinedLoginTournamentSetup;
