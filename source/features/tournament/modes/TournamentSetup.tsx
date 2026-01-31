import { cn, fetchCatAvatars } from "@utils";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import useAppStore from "@/store";
import type { NameItem } from "@/types";
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
				{/* Circular Profile Image - Shows Guest or User Avatar */}
				<div className="flex justify-center pt-6 pb-4">
					<button
						type="button"
						onClick={() => useAppStore.getState().uiActions.setEditingProfile(true)}
						className="group relative"
						aria-label={isLoggedIn ? "Edit profile" : "Login or create account"}
					>
						<div
							className={cn(
								"w-20 h-20 rounded-full border-2 overflow-hidden shadow-xl transition-all duration-300",
								isLoggedIn
									? "border-white/20 bg-slate-900 group-hover:border-purple-400 group-hover:scale-105 ring-4 ring-purple-500/20 group-hover:ring-purple-500/40"
									: "border-white/10 bg-slate-800 group-hover:border-cyan-400 group-hover:scale-105 ring-4 ring-cyan-500/10 group-hover:ring-cyan-500/30",
							)}
						>
							<img
								alt="Profile"
								className={cn("w-full h-full object-cover", !isLoggedIn && "opacity-70 grayscale")}
								src={user.avatarUrl || "https://placekitten.com/100/100"}
							/>
						</div>
						<div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/80 rounded-full text-[10px] text-white/60 font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
							{isLoggedIn ? "Edit" : "Login"}
						</div>
					</button>
				</div>
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
