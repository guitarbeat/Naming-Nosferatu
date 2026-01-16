import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { NameManagementView } from "../../shared/components/NameManagementView/NameManagementView";
import { ValidatedInput } from "../../shared/components/ValidatedInput";
import { useGreeting } from "../../shared/hooks/useGreeting";

import { useLoginController } from "../auth/hooks/authHooks";
import loginStyles from "../auth/styles/LoginScene.module.css";
import { useTournamentManager } from "./TournamentHooks";
import { PhotoGallery } from "../../shared/components/Gallery";
import { SwipeableCards } from "./TournamentViews";
import styles from "./tournament.module.css";

export default function TournamentSetup({
  onLogin,
  onStart,
  userName = "",
  isLoggedIn,
  onNameChange,
}: any) {
  const [analysisMode, setAnalysisMode] = useState(false);
  const { name, isLoading, handleNameChange, handleSubmit } =
    useLoginController(async (n: string) => {
      await onLogin(n);
    });
  const greeting = useGreeting();
  const manager = useTournamentManager({
    userName: isLoggedIn ? userName : "",
    onNameChange,
  });
  const {
    currentView,
    setCurrentView,
    galleryImages,
    isAdmin,
    handleImageOpen,
    handleImagesUploaded,
  } = manager;

  return (
    <AnimatePresence mode="wait">
      {!isLoggedIn ? (
        <motion.div key="login" className={loginStyles.loginWrapper}>
          <h1 className={loginStyles.loginTitle}>Welcome!</h1>
          <p className={loginStyles.loginSubtitle}>
            {greeting}, please enter your name.
          </p>
          <div className={loginStyles.loginInputTray}>
            <ValidatedInput
              type="text"
              placeholder="NAME..."
              value={name}
              onChange={handleNameChange}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          <button
            className={loginStyles.loginBtn}
            onClick={handleSubmit}
            disabled={isLoading}
          >
            STEP INSIDE
          </button>
        </motion.div>
      ) : (
        <motion.div key="setup" className="w-full">
          <div className={styles.identitySection}>
            <span className={styles.identityName}>{userName}</span>
            <button
              onClick={() =>
                setCurrentView(
                  currentView === "photos" ? "tournament" : "photos",
                )
              }
            >
              {currentView === "photos" ? "Back to Setup" : "View Gallery"}
            </button>
          </div>

          {currentView === "photos" ? (
            <div className="p-4">
              <PhotoGallery
                galleryImages={galleryImages}
                isAdmin={isAdmin}
                userName={userName}
                onImagesUploaded={handleImagesUploaded}
                onImageOpen={handleImageOpen}
                showAllPhotos
                onShowAllPhotosToggle={() => {}}
              />
            </div>
          ) : (
            <NameManagementView
              mode="tournament"
              userName={userName}
              analysisMode={analysisMode}
              setAnalysisMode={setAnalysisMode}
              tournamentProps={{
                swipeableCards: SwipeableCards,
                imageList: galleryImages,
              }}
              onStartTournament={onStart}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
