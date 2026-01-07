/**
 * @module CombinedLoginTournamentSetup
 * @description Combined login and tournament setup component.
 * Shows login screen when not logged in, transitions to tournament setup after login.
 */
import { AnimatePresence, motion } from "framer-motion";
import { Dices } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { ErrorComponent as Error } from "../../shared/components/CommonUI";
import { NameManagementView } from "../../shared/components/NameManagementView/NameManagementView";
import { ValidatedInput } from "../../shared/components/ValidatedInput/ValidatedInput";
import { useCatFact, useEyeTracking, useLoginController } from "../auth/hooks/authHooks";
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
import cardStyles from "./styles/SetupCards.module.css";
import layoutStyles from "./styles/SetupLayout.module.css";
import photoStyles from "./styles/SetupPhotos.module.css";
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
		handleBlur: handleLoginBlur,
		catFact: loginCatFact,
		nameSchema,
		touched: nameTouched,
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
		if (hour < 12) {
			return "Good morning";
		}
		if (hour < 18) {
			return "Good afternoon";
		}
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

	const lightboxElement = lightboxOpen && galleryImages && galleryImages.length > 0 && (
		<Lightbox
			images={galleryImages}
			currentIndex={lightboxIndex}
			onClose={handleLightboxClose}
			onNavigate={handleLightboxNavigate}
			preloadImages={preloadImages}
		/>
	);

	// Page transition wrapper with AnimatePresence
	return (
		<AnimatePresence mode="wait">
			{/* Login screen */}
			{!isLoggedIn && (
				<motion.div
					key="login"
					className={loginStyles.loginWrapper}
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{
						opacity: 0,
						scale: 1.05,
						transition: { duration: 0.3, ease: "easeInOut" }
					}}
					transition={{ duration: 0.4, ease: "easeOut" }}
				>
				<div className={loginStyles.scene}>
					{/* Cat with staggered entrance */}
					<motion.div
						className={loginStyles.cutOutCat}
						ref={catRef}
						initial={{ scale: 0, rotate: -10 }}
						animate={{ scale: 1, rotate: 0 }}
						transition={{
							duration: 0.8,
							delay: 0.2,
							type: "spring",
							stiffness: 200,
							damping: 20,
						}}
					>
						<motion.div
							className={loginStyles.eye}
							initial={{ opacity: 0 }}
							animate={{
								opacity: 1,
								x: eyePosition.x,
								y: eyePosition.y,
							}}
							transition={{
								opacity: { delay: 1.0, duration: 0.3 },
								x: { type: "spring", stiffness: 300, damping: 20 },
								y: { type: "spring", stiffness: 300, damping: 20 },
							}}
						/>
						<motion.div
							className={`${loginStyles.eye} ${loginStyles.eyeRight}`}
							initial={{ opacity: 0 }}
							animate={{
								opacity: 1,
								x: eyePosition.x,
								y: eyePosition.y,
							}}
							transition={{
								opacity: { delay: 1.0, duration: 0.3 },
								x: { type: "spring", stiffness: 300, damping: 20 },
								y: { type: "spring", stiffness: 300, damping: 20 },
							}}
						/>
					</motion.div>

					{/* Cat fact tape with slide-in animation */}
					<motion.div
						className={loginStyles.catFactTape}
						initial={{ x: -300, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						transition={{
							duration: 0.6,
							delay: 0.8,
							type: "spring",
							stiffness: 100,
						}}
					>
						{loginCatFact ? (
							<span>
								<strong>Fun Fact:</strong> {loginCatFact}
							</span>
						) : (
							"PREPARING FELINE WISDOM..."
						)}
					</motion.div>

					{/* Title with bounce entrance */}
					<motion.h1
						className={loginStyles.title}
						initial={{ y: -50, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{
							duration: 0.7,
							delay: 0.5,
							type: "spring",
							stiffness: 120,
							damping: 15,
						}}
					>
						Welcome, Purr-spective Judge!
					</motion.h1>

					{/* Subtitle with fade-in */}
					<motion.p
						className={loginStyles.subtitle}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 1.2 }}
					>
						{greeting}, please enter your name to get started.
					</motion.p>

					{/* Input tray with slide-up animation */}
					<motion.div
						className={loginStyles.inputTray}
						initial={{ y: 40, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{
							duration: 0.6,
							delay: 1.4,
							type: "spring",
							stiffness: 100,
						}}
					>
						<ValidatedInput
							type="text"
							placeholder="YOUR NAME HERE..."
							value={name}
							onChange={handleNameChange}
							onBlur={() => handleLoginBlur("name")}
							onKeyDown={handleKeyDown}
							disabled={isLoginLoading}
							autoFocus={true}
							maxLength={30}
							aria-label="Enter your name to register as a judge"
							schema={nameSchema}
							externalError={loginError}
							externalTouched={nameTouched}
						/>
					</motion.div>

					{/* Main button with scale entrance */}
					<motion.button
						className={loginStyles.leverBtn}
						onClick={handleLoginSubmit}
						disabled={isLoginLoading}
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						initial={{ scale: 0.8, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{
							duration: 0.5,
							delay: 1.6,
							type: "spring",
							stiffness: 200,
							damping: 20,
						}}
					>
						{isLoginLoading ? "PREPARING STAGE..." : "STEP INSIDE"}
					</motion.button>

					{/* Reroll button with staggered entrance */}
					<motion.button
						className={loginStyles.rerollBtn}
						onClick={handleRandomName}
						disabled={isLoginLoading}
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						aria-label="Generate random name"
						initial={{ x: 50, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						transition={{
							duration: 0.5,
							delay: 1.8,
							type: "spring",
							stiffness: 150,
						}}
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
			</motion.div>
			)}

			{/* Photos view */}
			{isLoggedIn && currentView === "photos" && (
				<motion.div
					key="photos"
					initial={{ opacity: 0, x: 100 }}
					animate={{ opacity: 1, x: 0 }}
					exit={{
						opacity: 0,
						x: -100,
						transition: { duration: 0.3, ease: "easeInOut" }
					}}
					transition={{ duration: 0.4, ease: "easeOut" }}
				>
					<ToastContainer />
					<div className={`${layoutStyles.container} ${photoStyles.photosViewContainer}`}>
					<div className={photoStyles.photosViewContent}>
						<h2 className={photoStyles.photosViewTitle}>Photo Gallery</h2>
						<p className={photoStyles.photosViewSubtitle}>Click any photo to view full size</p>
						<PhotoGallery {...photoGalleryProps} />
					</div>
				</div>
				{lightboxElement}
				</motion.div>
			)}

			{/* Tournament setup view */}
			{isLoggedIn && currentView !== "photos" && (
				<motion.div
					key="tournament-setup"
					initial={{ opacity: 0, x: 100 }}
					animate={{ opacity: 1, x: 0 }}
					exit={{
						opacity: 0,
						x: -100,
						transition: { duration: 0.3, ease: "easeInOut" }
					}}
					transition={{ duration: 0.4, ease: "easeOut" }}
				>
					<ToastContainer />
					<div className={layoutStyles.container}>
				{/* Name Identity Section */}
				<div className={identityStyles.identitySection}>
					{isEditingName ? (
						<form onSubmit={handleNameSubmit} className={identityStyles.identityForm}>
							<ValidatedInput
								type="text"
								value={tempName}
								onChange={(e) => setTempName(e.target.value)}
								autoFocus={true}
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
								schema={nameSchema}
								className={identityStyles.identityInputWrapper}
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
						// biome-ignore lint/style/useNamingConvention: Component reference prop, PascalCase is appropriate for JSX
						SwipeableCards: SwipeableNameCards,
						isAdmin,
						imageList: galleryImages || [],
						gridClassName: cardStyles.cardsContainer,
					}}
					profileProps={{
						isAdmin: canManageActiveUser,
						showUserFilter: profileIsAdmin,
						userOptions: userOptions ?? undefined,
						userFilter,
						setUserFilter,
						stats: stats ? (stats as unknown as Record<string, unknown>) : undefined,
						selectionStats: selectionStats
							? (selectionStats as unknown as Record<string, unknown>)
							: undefined,
						onToggleVisibility: (nameId) => handlersRef.current.handleToggleVisibility?.(nameId),
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
		</motion.div>
			)}
		</AnimatePresence>
	);
}

function CombinedLoginTournamentSetup(props: CombinedLoginTournamentSetupProps) {
	return (
		<ErrorBoundary variant="boundary">
			<CombinedLoginTournamentSetupContent {...props} />
		</ErrorBoundary>
	);
}

CombinedLoginTournamentSetup.displayName = "CombinedLoginTournamentSetup";

export default CombinedLoginTournamentSetup;
