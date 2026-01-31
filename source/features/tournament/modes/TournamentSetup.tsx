import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import useAppStore from "@/store/appStore";
import type { NameItem } from "@/types/appTypes";
import { fetchCatAvatars } from "@/utils/basic";
import { CAT_IMAGES } from "@/utils/constants";
import { SwipeableCards } from "../components/SwipeableCards";
import { NameManagementView } from "./NameManagementView";

interface TournamentSetupProps {
	onStart: (selectedNames: NameItem[]) => void;
	userName?: string;
	isLoggedIn: boolean;
	onNameChange?: (names: NameItem[]) => void;
}

export default function TournamentSetup({
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
	return (
		<AnimatePresence mode="wait">
			<motion.div
				key="setup"
				className="w-full flex-1"
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -10 }}
			>
				<NameManagementView
					mode="tournament"
					userName={userName}
					analysisMode={analysisMode}
					setAnalysisMode={setAnalysisMode}
					tournamentProps={{
						swipeableCards: SwipeableCards,
						imageList: CAT_IMAGES,
					}}
					onStartTournament={onStart}
				/>
			</motion.div>
		</AnimatePresence>
	);
}
