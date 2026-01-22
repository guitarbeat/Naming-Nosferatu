import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import useAppStore from "../../core/store/useAppStore";
import { Input } from "../../shared/components/FormPrimitives";
import { NameManagementView } from "../../shared/components/NameManagementView/NameManagementView";
import { getGreeting } from "../../shared/utils";
import { fetchCatAvatars } from "../../shared/utils/catApi";
import type { NameItem } from "../../types/components";
import { useLoginController } from "../auth/authHooks";
import loginStyles from "../auth/LoginScene.module.css";
import { SwipeableCards } from "./TournamentComponents";
import { useTournamentManager } from "./TournamentHooks";
import styles from "./tournament.module.css";

interface TournamentSetupProps {
	onLogin: (name: string) => Promise<boolean | undefined>;
	onStart: (selectedNames: NameItem[]) => void;
	userName?: string;
	isLoggedIn: boolean;
	onNameChange?: (names: NameItem[]) => void;
}

export default function TournamentSetup({
	onLogin,
	onStart,
	userName = "",
	isLoggedIn,
}: TournamentSetupProps) {
	const [analysisMode, setAnalysisMode] = useState(false);

	const { user, userActions } = useAppStore();

	useEffect(() => {
		if (isLoggedIn && !user.avatarUrl) {
			fetchCatAvatars(1).then((avatars) => {
				if (avatars[0]) {
					userActions.setAvatar(avatars[0]);
				}
			});
		}
	}, [isLoggedIn, user.avatarUrl, userActions]);

	// ... login controller ...
	const { name, isLoading, handleNameChange, handleSubmit } = useLoginController(
		async (n: string) => {
			await onLogin(n);
		},
	);

	const greeting = getGreeting();
	const manager = useTournamentManager({
		userName: isLoggedIn ? userName : "",
	});
	const { galleryImages } = manager;

	return (
		<AnimatePresence mode="wait">
			{isLoggedIn ? (
				<motion.div key="setup" className="w-full">
					<div className={styles.identitySection}>
						<div className="flex gap-4 items-center">
							{/* Avatar Display */}
							{user.avatarUrl && (
								<div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[var(--primary-200)] shadow-sm">
									<img
										src={user.avatarUrl}
										alt="User Avatar"
										className="w-full h-full object-cover"
									/>
								</div>
							)}
							<span className={styles.identityName}>{userName}</span>
						</div>
					</div>

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
				</motion.div>
			) : (
				<motion.div key="login" className={loginStyles.loginWrapper}>
					<h1 className={loginStyles.loginTitle}>Welcome!</h1>
					<p className={loginStyles.loginSubtitle}>{greeting}, please enter your name.</p>
					<div className={loginStyles.loginInputTray}>
						<Input
							type="text"
							placeholder="NAME..."
							value={name}
							onChange={handleNameChange}
							onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && handleSubmit()}
						/>
					</div>
					<button className={loginStyles.loginBtn} onClick={handleSubmit} disabled={isLoading}>
						STEP INSIDE
					</button>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
