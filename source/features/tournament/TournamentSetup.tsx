import { cn } from "@utils/cn";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { NameManagementView } from "@/components/NameManagementView/NameManagementView";
import useAppStore from "@/store/useAppStore";
import type { NameItem } from "@/types/components";
import { getGreeting } from "@/utils";
import { fetchCatAvatars } from "@/utils/catApi";
import { Input } from "../../shared/components/FormPrimitives";
import { useLoginController } from "../auth/authHooks";
import { SwipeableCards } from "./TournamentComponents";

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
					<NameManagementView
						mode="tournament"
						userName={userName}
						analysisMode={analysisMode}
						setAnalysisMode={setAnalysisMode}
						tournamentProps={{
							swipeableCards: SwipeableCards,
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

					<Card className="w-full space-y-6" padding="large" background="glass">
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
					</Card>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
