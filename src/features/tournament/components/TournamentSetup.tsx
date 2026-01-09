/**
 * @module TournamentSetup
 * @description Combined login and tournament setup component.
 * Shows login screen when not logged in, transitions to tournament setup after login.
 */
import { AnimatePresence, motion } from "framer-motion";
import { Dices } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { ErrorComponent } from "../../../shared/components/Error";
import { NameManagementView } from "../../../shared/components/NameManagementView/NameManagementView";
import { ValidatedInput } from "../../../shared/components/ValidatedInput/ValidatedInput";
import type { NameItem } from "../../../types/components";
import { useCatFact, useEyeTracking, useLoginController } from "../../auth/hooks/authHooks";
import { useTournamentController } from "../hooks/useTournamentController";
import setupStyles from "../styles/Setup.module.css";
import {
	AnalysisBulkActionsWrapper,
	AnalysisHandlersProvider,
	createAnalysisDashboardWrapper,
} from "./AnalysisWrappers";
import Lightbox from "./Lightbox";
import { SwipeableCards } from "./SwipeableCards";
import { PhotoGallery } from "./TournamentSidebar/PhotoComponents";

interface TournamentSetupProps {
	onLogin: (name: string) => Promise<boolean>;
	onStart: (selectedNames: NameItem[]) => void;
	userName?: string;
	isLoggedIn: boolean;
	enableAnalysisMode?: boolean;
	onOpenSuggestName?: () => void;
	onNameChange?: (name: string) => void;
	existingRatings?: Record<string, number>;
}

function TournamentSetupContent({
	onLogin,
	onStart: _onStart,
	userName = "",
	isLoggedIn,
	enableAnalysisMode = false,
	onOpenSuggestName: _onOpenSuggestName,
	onNameChange,
	existingRatings: _existingRatings,
}: TournamentSetupProps) {
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
	} = useLoginController(async (loginName: string): Promise<void> => {
		await onLogin(loginName);
	});

	// Track eye position for login screen
	const eyePosition = useEyeTracking({ catRef, catSvgRef: catRef });

	// Time-based greeting
	const greeting = useMemo(() => {
		const hour = new Date().getHours();
		if (hour < 12) return "Good morning";
		if (hour < 18) return "Good afternoon";
		return "Good evening";
	}, []);

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
		activeUser,
		canManageActiveUser,
		stats,
		selectionStats,
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

	const catFact = useCatFact();

	const photoGalleryProps = useMemo(
		() => ({
			galleryImages: galleryImages || [],
			showAllPhotos,
			onShowAllPhotosToggle: () => setShowAllPhotos((v: boolean) => !v),
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
					className={setupStyles.loginWrapper}
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{
						opacity: 0,
						scale: 1.05,
						transition: { duration: 0.3, ease: "easeInOut" },
					}}
					transition={{ duration: 0.4, ease: "easeOut" }}
				>
					<div className={setupStyles.loginScene}>
						{/* Cat silhouette with eyes */}
						<motion.div
							className={setupStyles.loginCat}
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
								className={setupStyles.loginEye}
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
								className={`${setupStyles.loginEye} ${setupStyles.loginEyeRight}`}
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

						{/* Cat fact tape */}
						<motion.div
							className={setupStyles.loginTape}
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

						{/* Title */}
						<motion.h1
							className={setupStyles.loginTitle}
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

						{/* Subtitle */}
						<motion.p
							className={setupStyles.loginSubtitle}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 1.2 }}
						>
							{greeting}, please enter your name to get started.
						</motion.p>

						{/* Input tray */}
						<motion.div
							className={setupStyles.loginInputTray}
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

						{/* Main button */}
						<motion.button
							className={setupStyles.loginBtn}
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

						{/* Reroll button */}
						<motion.button
							className={setupStyles.loginRerollBtn}
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
						transition: { duration: 0.3, ease: "easeInOut" },
					}}
					transition={{ duration: 0.4, ease: "easeOut" }}
				>
					<ToastContainer />
					<div className={`${setupStyles.container} ${setupStyles.photosViewContainer}`}>
						<div className={setupStyles.photosViewContent}>
							<h2 className={setupStyles.photosViewTitle}>Photo Gallery</h2>
							<p className={setupStyles.photosViewSubtitle}>Click any photo to view full size</p>
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
						transition: { duration: 0.3, ease: "easeInOut" },
					}}
					transition={{ duration: 0.4, ease: "easeOut" }}
				>
					<ToastContainer />
					<div className={setupStyles.container}>
						{/* Name Identity Section */}
						<div className={setupStyles.identitySection}>
							{isEditingName ? (
								<form onSubmit={handleNameSubmit} className={setupStyles.identityForm}>
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
										className={setupStyles.identityInputWrapper}
									/>
									<button type="submit" className={setupStyles.identitySaveBtn}>
										✓
									</button>
								</form>
							) : (
								<div className={setupStyles.identityDisplay}>
									<span className={setupStyles.identityName}>{userName}</span>
									<button
										className={setupStyles.identityEditBtn}
										onClick={() => toggleEditingName(true)}
										aria-label="Change Name"
									>
										[ EDIT ]
									</button>
								</div>
							)}
						</div>

						{/* Cat Fact Tape / System Feed */}
						<div className={setupStyles.catFactSection}>
							<div className={setupStyles.tapeDecorator} />
							<span className={setupStyles.tapeContent}>
								{catFact ? catFact.toUpperCase() : "SYNCING FELINE DATABASE..."}
							</span>
						</div>

						<NameManagementView
							mode="tournament"
							userName={userName}
							analysisMode={analysisMode}
							setAnalysisMode={setAnalysisMode}
							extensions={{
								dashboard: createAnalysisDashboardWrapper(
									stats as any,
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
							tournamentProps={{
								swipeableCards: SwipeableCards,
								imageList: galleryImages,
							}}
							onStartTournament={_onStart}
							onOpenSuggestName={_onOpenSuggestName}
						/>
						{lightboxElement}
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

function TournamentSetup(props: TournamentSetupProps) {
	return (
		<ErrorComponent variant="boundary">
			<TournamentSetupContent {...props} />
		</ErrorComponent>
	);
}

TournamentSetup.displayName = "TournamentSetup";

export default TournamentSetup;
