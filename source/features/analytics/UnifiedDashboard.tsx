import { CardBody, Button as HeroButton, Spinner } from "@heroui/react";
import { coreAPI } from "@supabase/client";
import { Copy, Download, Heart, Plus, Shuffle } from "lucide-react";
import React, { Suspense, useMemo, useState } from "react";
import { RankingAdjustment } from "@/features/tournament/components/RankingAdjustment";
import { Card } from "@/features/ui/Card";
import useLocalStorage from "@/hooks/useBrowserState";
import { useToast } from "@/providers/ToastProvider";
import type { NameItem } from "@/types";
import { exportTournamentResultsToCSV } from "@/utils";
import { AnalysisDashboard } from "./AnalysisDashboard";
import { usePersonalResults } from "./usePersonalResults";

/* =========================================================================
   SUB-COMPONENTS
   ========================================================================= */

/**
 * PersonalResults Component
 */
export const PersonalResults = ({
	personalRatings,
	currentTournamentNames,
	onStartNew,
	onUpdateRatings,
}: {
	personalRatings: Record<string, unknown> | undefined;
	currentTournamentNames?: NameItem[];
	onStartNew: () => void;
	onUpdateRatings: (
		ratings: Record<string, { rating: number; wins?: number; losses?: number }>,
	) => void;
	userName?: string;
}) => {
	const { rankings } = usePersonalResults({ personalRatings, currentTournamentNames });
	const { showToast } = useToast();

	return (
		<div className="flex flex-col gap-6 w-full">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card variant="warning" className="backdrop-blur-sm">
					<CardBody className="flex flex-col items-center justify-center gap-2 p-6">
						<span className="text-4xl select-none">🏆</span>
						<h3 className="text-sm font-medium text-white/60">Champion</h3>
						<p className="text-xl font-bold text-white truncate max-w-full">
							{rankings[0]?.name || "-"}
						</p>
					</CardBody>
				</Card>

				<Card variant="primary" className="backdrop-blur-sm">
					<CardBody className="flex flex-col items-center justify-center gap-2 p-6">
						<span className="text-4xl select-none">⭐</span>
						<h3 className="text-sm font-medium text-white/60">Highest Rated</h3>
						<p className="text-xl font-bold text-white">{String(rankings[0]?.rating || 1500)}</p>
					</CardBody>
				</Card>

				<Card variant="info" className="backdrop-blur-sm">
					<CardBody className="flex flex-col items-center justify-center gap-2 p-6">
						<span className="text-4xl select-none">📝</span>
						<h3 className="text-sm font-medium text-white/60">Names Ranked</h3>
						<p className="text-xl font-bold text-white">{rankings.length}</p>
					</CardBody>
				</Card>
			</div>

			<RankingAdjustment
				rankings={rankings}
				onSave={async (r: NameItem[]) => {
					const ratingsMap = Object.fromEntries(
						r.map((n) => [n.name, { rating: n.rating as number, wins: n.wins, losses: n.losses }]),
					);
					await onUpdateRatings(ratingsMap);
					showToast("Updated!", "success");
				}}
				onCancel={onStartNew}
			/>

			<div className="flex flex-wrap gap-3 justify-end">
				<HeroButton
					onClick={onStartNew}
					variant="flat"
					className="bg-purple-500/20 hover:bg-purple-500/30 text-white"
					startContent={<Plus size={18} />}
				>
					New Tournament
				</HeroButton>
				<HeroButton
					variant="flat"
					className="bg-white/5 hover:bg-white/10 text-white"
					startContent={<Download size={18} />}
					onClick={() => {
						if (!rankings.length) {
							return;
						}
						exportTournamentResultsToCSV(rankings);
					}}
				>
					Export CSV
				</HeroButton>
			</div>
		</div>
	);
};

/**
 * RandomGenerator Component
 */
const RandomGenerator: React.FC<{ userName: string }> = ({ userName: _userName }) => {
	const [generatedName, setGeneratedName] = useState<string | null>(null);
	const [isGenerating, setIsGenerating] = useState(false);
	const [storedFavorites, setStoredFavorites] = useLocalStorage<string[]>("cat_name_favorites", []);
	const favorites = useMemo(() => new Set(storedFavorites), [storedFavorites]);

	const generateName = async () => {
		setIsGenerating(true);
		try {
			const allNames = await coreAPI.getTrendingNames();
			if (allNames.length > 0) {
				const random = allNames[Math.floor(Math.random() * allNames.length)];
				if (random) {
					setGeneratedName(random.name);
				}
			} else {
				setGeneratedName("Luna");
			}
		} catch (e) {
			console.error(e);
			setGeneratedName("Oliver");
		} finally {
			setIsGenerating(false);
		}
	};

	const copyToClipboard = async (name: string) => {
		try {
			await navigator.clipboard.writeText(name);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const toggleFavorite = (name: string) => {
		const newFavorites = new Set(favorites);
		if (newFavorites.has(name)) {
			newFavorites.delete(name);
		} else {
			newFavorites.add(name);
		}
		setStoredFavorites(Array.from(newFavorites));
	};

	return (
		<div className="flex flex-col max-w-2xl mx-auto w-full">
			<h2 className="text-2xl font-bold text-white text-center mb-2">Random Name Generator</h2>
			<p className="text-white/60 text-center mb-8">Can't decide? Let fate decide for you.</p>

			<Card className="w-full min-h-[240px]">
				<CardBody className="flex flex-col items-center justify-center gap-8 py-12">
					<div className="text-center w-full min-h-[100px] flex flex-col items-center justify-center">
						{isGenerating ? (
							<div className="flex flex-col items-center gap-4">
								<Spinner size="lg" color="secondary" />
							</div>
						) : generatedName ? (
							<div className="flex flex-col items-center gap-6 animate-in zoom-in-95 leading-none">
								<h3 className="text-5xl md:text-6xl font-black text-white/90 tracking-tight drop-shadow-2xl">
									{generatedName}
								</h3>
								<div className="flex gap-2">
									<HeroButton
										isIconOnly={true}
										variant="flat"
										className="bg-white/5 hover:bg-white/10 text-white"
										onPress={() => toggleFavorite(generatedName)}
									>
										<Heart
											size={20}
											className={favorites.has(generatedName) ? "fill-pink-500 text-pink-500" : ""}
										/>
									</HeroButton>
									<HeroButton
										isIconOnly={true}
										variant="flat"
										className="bg-white/5 hover:bg-white/10 text-white"
										onPress={() => copyToClipboard(generatedName)}
									>
										<Copy size={20} />
									</HeroButton>
								</div>
							</div>
						) : (
							<div className="text-white/20 flex flex-col items-center gap-2">
								<Shuffle size={48} />
								<p>Tap to generate</p>
							</div>
						)}
					</div>

					<HeroButton
						size="lg"
						className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold px-8 shadow-lg shadow-purple-900/20"
						onPress={generateName}
						isDisabled={isGenerating}
					>
						{isGenerating ? "Generating..." : "Generate Name"}
					</HeroButton>
				</CardBody>
			</Card>

			{favorites.size > 0 && (
				<div className="flex flex-col gap-4">
					<h3 className="text-lg font-semibold text-white/80 flex items-center gap-2">
						<Heart size={16} className="text-pink-500 fill-pink-500" />
						Favorites
					</h3>
					<div className="flex flex-wrap gap-2">
						{Array.from(favorites).map((name) => (
							<React.Fragment key={name}>
								<div className="bg-white/5 border border-white/10 pl-2 pr-1 py-1 rounded-full flex items-center gap-1">
									<span className="text-sm">{name}</span>
									<button
										onClick={() => toggleFavorite(name)}
										className="hover:bg-white/10 rounded-full p-1"
									>
										<span className="text-xs">✕</span>
									</button>
								</div>
							</React.Fragment>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

/* =========================================================================
   MAIN DASHBOARD COMPONENT
   ========================================================================= */

const TABS = [
	{ id: "results", label: "My Ranking", icon: "📊" },
	{ id: "community", label: "Global Ranks", icon: "🌍" },
	{ id: "random", label: "Surprise Me", icon: "🎲" },
];

export function UnifiedDashboard({
	personalRatings,
	currentTournamentNames,
	onStartNew,
	onUpdateRatings,
	userName,
}: {
	personalRatings?: Record<string, unknown>;
	currentTournamentNames?: NameItem[];
	onStartNew: () => void;
	onUpdateRatings: (
		ratings: Record<string, { rating: number; wins?: number; losses?: number }>,
	) => void;
	userName: string;
}) {
	const [activeTab, setActiveTab] = useState("results");

	const renderContent = () => {
		switch (activeTab) {
			case "results":
				return (
					<PersonalResults
						personalRatings={personalRatings}
						currentTournamentNames={currentTournamentNames}
						onStartNew={onStartNew}
						onUpdateRatings={onUpdateRatings}
						userName={userName}
					/>
				);
			case "community":
				return (
					<Suspense
						fallback={
							<div className="flex justify-center p-8">
								<Spinner size="lg" color="secondary" />
							</div>
						}
					>
						<AnalysisDashboard
							userName={userName}
							showGlobalLeaderboard={true}
							defaultCollapsed={false}
							isAdmin={false}
						/>
					</Suspense>
				);
			case "random":
				return <RandomGenerator userName={userName} />;
			default:
				return null;
		}
	};

	return (
		<div className="w-full max-w-[1200px] mx-auto px-4 pb-20 pt-8">
			<div className="bg-white/5 p-1 rounded-xl flex gap-1 overflow-x-auto max-w-full mx-auto mb-8 justify-center">
				{TABS.map((tab) => (
					<button
						key={tab.id}
						onClick={() => setActiveTab(tab.id)}
						className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
							activeTab === tab.id
								? "bg-white/10 text-white shadow-sm"
								: "text-white/50 hover:text-white/80 hover:bg-white/5"
						}`}
					>
						<span>{tab.icon}</span>
						<span>{tab.label}</span>
					</button>
				))}
			</div>

			<div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
				{renderContent()}
			</div>
		</div>
	);
}
