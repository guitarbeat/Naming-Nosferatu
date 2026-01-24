import { CardBody, Chip, cn, Button as HeroButton, Card as HeroCard, Spinner } from "@heroui/react";
import { coreAPI } from "@supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Copy, Download, Heart, Plus, Shuffle } from "lucide-react";
import React, { lazy, Suspense, useEffect, useMemo, useState } from "react";
import useLocalStorage from "@/hooks/useStorage";
import { useToast } from "@/providers/ToastProvider";
import type { NameItem } from "@/types/components";
import { Loading } from "../../shared/components/Loading";

import { RankingAdjustment } from "./TournamentComponents";

const AnalysisDashboard = lazy(() =>
	import("../analytics/AnalysisDashboard").then((m) => ({
		default: m.AnalysisDashboard,
	})),
);
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
	voteHistory?: unknown[];
	userName?: string;
}) => {
	const [rankings, setRankings] = useState<NameItem[]>([]);
	const { showToast } = useToast();

	useEffect(() => {
		if (!personalRatings) {
			return;
		}
		const processed = Object.entries(personalRatings)
			.map(([name, rating]: [string, unknown]) => {
				const r = rating as { rating?: number; wins?: number; losses?: number } | number;
				return {
					name,
					rating: Math.round(typeof r === "number" ? r : r?.rating || 1500),
					wins: typeof r === "number" ? 0 : r?.wins || 0,
					losses: typeof r === "number" ? 0 : r?.losses || 0,
					id: currentTournamentNames?.find((n: NameItem) => n.name === name)?.id,
				};
			})
			.sort((a, b) => b.rating - a.rating);
		setRankings(processed as NameItem[]);
	}, [personalRatings, currentTournamentNames]);

	return (
		<div className="flex flex-col gap-6 w-full">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<HeroCard className="bg-yellow-900/10 border border-yellow-500/20 backdrop-blur-sm">
					<CardBody className="flex flex-col items-center justify-center gap-2 p-6">
						<span className="text-4xl select-none">🏆</span>
						<h3 className="text-sm font-medium text-white/60">Champion</h3>
						<p className="text-xl font-bold text-white truncate max-w-full">
							{rankings[0]?.name || "-"}
						</p>
					</CardBody>
				</HeroCard>

				<HeroCard className="bg-purple-900/10 border border-purple-500/20 backdrop-blur-sm">
					<CardBody className="flex flex-col items-center justify-center gap-2 p-6">
						<span className="text-4xl select-none">⭐</span>
						<h3 className="text-sm font-medium text-white/60">Highest Rated</h3>
						<p className="text-xl font-bold text-white">{String(rankings[0]?.rating || 1500)}</p>
					</CardBody>
				</HeroCard>

				<HeroCard className="bg-blue-900/10 border border-blue-500/20 backdrop-blur-sm">
					<CardBody className="flex flex-col items-center justify-center gap-2 p-6">
						<span className="text-4xl select-none">📝</span>
						<h3 className="text-sm font-medium text-white/60">Names Ranked</h3>
						<p className="text-xl font-bold text-white">{rankings.length}</p>
					</CardBody>
				</HeroCard>
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
						const headers = ["Name", "Rating", "Wins", "Losses"];
						const rows = rankings.map((r) =>
							[`"${r.name}"`, r.rating, r.wins || 0, r.losses || 0].join(","),
						);
						const csvContent = [headers.join(","), ...rows].join("\n");
						const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
						const link = document.createElement("a");
						link.href = URL.createObjectURL(blob);
						link.setAttribute("download", `cat_names_${new Date().toISOString().slice(0, 10)}.csv`);
						document.body.appendChild(link);
						link.click();
						document.body.removeChild(link);
					}}
				>
					Export CSV
				</HeroButton>
			</div>
		</div>
	);
};

/**
 * NameDiscovery Component
 */
const NameDiscovery: React.FC<{ userName: string }> = ({ userName: _userName }) => {
	const {
		data: popularNames,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["popular-names"],
		queryFn: async () => {
			// Real data fetch instead of mocked/randomized
			const names = await coreAPI.getNamesWithDescriptions();
			// Sort by actual rating/popularity if available, otherwise just use the names list
			return names.slice(0, 24).map((name) => ({
				...name,
				status: "candidate", // Default status as we removed the complex logic
			}));
		},
		staleTime: 5 * 60 * 1000,
	});

	if (isLoading) {
		return <Loading variant="spinner" text="Loading names..." />;
	}

	if (error) {
		return (
			<div className="p-6 text-center text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl">
				Unable to load names right now.
			</div>
		);
	}

	return (
		<div className="flex flex-col w-full">
			<h2 className="text-2xl font-bold text-white mb-1">Trending Names</h2>
			<p className="text-white/60 mb-6">Community favorites</p>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
				{popularNames?.map((name, index) => (
					<HeroCard
						key={name.id}
						className="bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
						shadow="sm"
					>
						<CardBody className="p-4 flex flex-col gap-3">
							<div className="flex justify-between items-start">
								<Chip size="sm" variant="flat" className="bg-white/10 text-white/50">
									#{index + 1}
								</Chip>
							</div>
							<h3 className="text-lg font-bold text-white truncate">{name.name}</h3>
							<p className="text-sm text-white/40 line-clamp-2 min-h-[2.5em]">
								{name.description || "No description available"}
							</p>
						</CardBody>
					</HeroCard>
				))}
			</div>
		</div>
	);
};

/**
 * RandomGenerator Component (Simplified)
 */
const RandomGenerator: React.FC<{ userName: string }> = ({ userName: _userName }) => {
	const [generatedName, setGeneratedName] = useState<string | null>(null);
	const [isGenerating, setIsGenerating] = useState(false);
	const [storedFavorites, setStoredFavorites] = useLocalStorage<string[]>("cat_name_favorites", []);
	const favorites = useMemo(() => new Set(storedFavorites), [storedFavorites]);

	const generateName = async () => {
		setIsGenerating(true);
		try {
			// Fetch a random name from the API or local set
			const allNames = await coreAPI.getNamesWithDescriptions();
			if (allNames.length > 0) {
				const random = allNames[Math.floor(Math.random() * allNames.length)];
				if (random) {
					setGeneratedName(random.name);
				}
			} else {
				setGeneratedName("Luna"); // Fallback
			}
		} catch (e) {
			console.error(e);
			setGeneratedName("Oliver"); // Fallback
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

			<HeroCard className="w-full min-h-[240px] bg-gradient-to-br from-white/5 to-transparent border border-white/10">
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
											className={cn(favorites.has(generatedName) && "fill-pink-500 text-pink-500")}
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
			</HeroCard>

			{favorites.size > 0 && (
				<div className="flex flex-col gap-4">
					<h3 className="text-lg font-semibold text-white/80 flex items-center gap-2">
						<Heart size={16} className="text-pink-500 fill-pink-500" />
						Favorites
					</h3>
					<div className="flex flex-wrap gap-2">
						{Array.from(favorites).map((name) => (
							<Chip
								key={name}
								onClose={() => toggleFavorite(name)}
								variant="flat"
								className="bg-white/5 border border-white/10 pl-2"
							>
								{name}
							</Chip>
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

// Simplified Tabs config
const TABS = [
	{ id: "results", label: "My Rankings", icon: "📊" },
	{ id: "community", label: "Global Ranks", icon: "🌍" },
	{ id: "discover", label: "Inspiration", icon: "✨" }, // Renamed from Explore
	{ id: "random", label: "Surprise Me", icon: "🎲" },
];

export default function Dashboard({
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
							<div className="flex justify-center p-12">
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
			case "discover":
				return <NameDiscovery userName={userName} />;
			case "random":
				return <RandomGenerator userName={userName} />;
			default:
				return null;
		}
	};

	return (
		<div className="w-full max-w-[1200px] mx-auto px-4 pb-20 pt-8">
			{/* Simple Tab Navigation */}
			<div className="bg-white/5 p-1 rounded-xl flex gap-1 overflow-x-auto max-w-full mx-auto mb-8 justify-center">
				{TABS.map((tab) => (
					<button
						key={tab.id}
						onClick={() => setActiveTab(tab.id)}
						className={cn(
							"flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
							activeTab === tab.id
								? "bg-white/10 text-white shadow-sm"
								: "text-white/50 hover:text-white/80 hover:bg-white/5",
						)}
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
