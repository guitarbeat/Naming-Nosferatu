import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Input } from "@/components/FormPrimitives";
import { NameManagementView } from "@/components/NameManagementView/NameManagementView";
import useAppStore from "@/store/useAppStore";
import type { NameItem } from "@/types/components";
import { getGreeting } from "@/utils";
import { fetchCatAvatars } from "@/utils/catApi";
import { cn } from "@/utils/cn";
import { useLoginController } from "../auth/authHooks";
import { SwipeableCards } from "./TournamentComponents";
import { useTournamentManager } from "./TournamentHooks";

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
				<motion.div
					key="setup"
					className="w-full flex-1"
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -10 }}
				>
					<div className="flex justify-end mb-6 px-4 md:px-8 max-w-[1600px] mx-auto">
						<div className="flex gap-4 items-center bg-black/30 backdrop-blur-md border border-white/5 py-2 px-4 rounded-full">
							{/* Avatar Display */}
							{user.avatarUrl && (
								<div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 shadow-sm relative">
									<img
										src={user.avatarUrl}
										alt="User Avatar"
										className="w-full h-full object-cover"
									/>
									<div className="absolute inset-0 rounded-full shadow-[inset_0_0_4px_rgba(0,0,0,0.5)]" />
								</div>
							)}
							<span className="text-sm font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-300 font-mono">
								{userName}
							</span>
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
				<motion.div
					key="login"
					className="flex flex-col items-center justify-center min-h-[60vh] max-w-lg mx-auto p-8 gap-10 relative z-10"
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.95 }}
				>
					<div className="text-center space-y-4">
						<h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 tracking-tighter drop-shadow-2xl">
							Welcome!
						</h1>
						<p className="text-lg md:text-xl text-white/50 font-medium tracking-wide">
							{greeting}, please enter your name.
						</p>
					</div>

					<div className="w-full space-y-6 bg-black/40 backdrop-blur-xl p-8 rounded-3xl border border-white/5 shadow-2xl">
						<div className="space-y-4">
							<Input
								type="text"
								placeholder="NAME..."
								value={name}
								onChange={handleNameChange}
								onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && handleSubmit()}
								className="text-center text-lg h-14 bg-white/5 border-white/10 focus:border-purple-500/50 focus:bg-white/10"
								autoFocus={true}
							/>
						</div>
						<button
							className={cn(
								"w-full py-4 text-center font-black tracking-[0.2em] text-sm uppercase bg-white text-black rounded-xl",
								"hover:bg-purple-50 hover:scale-[1.02] active:scale-[0.98]",
								"transition-all duration-300 shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)]",
								isLoading && "opacity-50 cursor-not-allowed grayscale",
							)}
							onClick={handleSubmit}
							disabled={isLoading}
						>
							{isLoading ? "Loading..." : "Step Inside"}
						</button>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
