import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import useAppStore from "../../core/store/useAppStore";
import Button from "../../shared/components/Button";
import { NameManagementView } from "../../shared/components/NameManagementView/NameManagementView";
import { Input } from "../../shared/components/FormPrimitives";
import { useGreeting } from "../../shared/hooks/useGreeting";
import { fetchCatAvatars } from "../../shared/utils/catApi";
import type { NameItem } from "../../types/components";
import { useLoginController } from "../auth/hooks/authHooks";
import loginStyles from "../auth/styles/LoginScene.module.css";
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
	const [isEditingName, setIsEditingName] = useState(false);
	const [editedName, setEditedName] = useState(userName);
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

	// ... handlers ...
	const handleUpdateName = async () => {
		if (!editedName.trim()) {
			return;
		}
		await onLogin(editedName.trim());
		setIsEditingName(false);
	};
	const greeting = useGreeting();
	const manager = useTournamentManager({
		userName: isLoggedIn ? userName : "",
	});
	const { galleryImages } = manager;

	return (
		<AnimatePresence mode="wait">
			{isLoggedIn ? (
				<motion.div key="setup" className="w-full">
					<div className={styles.identitySection}>
						{isEditingName ? (
							<div className="flex gap-2 items-center">
							<Input
								type="text"
								value={editedName}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									setEditedName(e.target.value)
								}
								placeholder="Your Name..."
							/>
								<Button onClick={handleUpdateName} variant="primary">
									Save
								</Button>
								<Button onClick={() => setIsEditingName(false)} variant="secondary">
									Cancel
								</Button>
							</div>
						) : (
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
								<button
									className="text-xs text-slate-500 hover:text-slate-300"
									onClick={() => {
										setEditedName(userName);
										setIsEditingName(true);
									}}
								>
									Edit Name
								</button>
							</div>
						)}
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
