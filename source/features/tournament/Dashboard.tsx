import { coreAPI } from "@supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
	Copy,
	Download,
	Grid3X3,
	Heart,
	List,
	Plus,
	RefreshCw,
	Search,
	Shuffle,
	Sparkles,
	TrendingUp,
	Users,
} from "lucide-react";
import {
	Button as HeroButton,
	Card as HeroCard,
	CardBody,
	CardHeader,
	Chip,
	Tooltip,
	Spinner,
	Skeleton,
	ButtonGroup,
	Divider,
	cn,
} from "@heroui/react";
import type React from "react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { Loading } from "@/components/Loading";
import { TabContainer } from "@/components/TabContainer";
import { Toast } from "@/components/Toast";
import useLocalStorage from "@/hooks/useStorage";
import { useToast } from "@/providers/ToastProvider";
import type { NameItem } from "@/types/components";
import styles from "./Dashboard.module.css";
import { RankingAdjustment } from "./TournamentComponents";

const AnalysisDashboard = lazy(() =>
	import("../analytics/AnalysisDashboard").then((m) => ({
		default: m.AnalysisDashboard,
	})),
);
const GalleryView = lazy(() => import("../gallery/GalleryView"));

/* =========================================================================
   SUB-COMPONENTS
   ========================================================================= */

/**
 * PersonalResults Component (Originally from TournamentDashboard)
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
			{/* Stats Grid */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{/* Winner Card */}
				<HeroCard className="bg-gradient-to-br from-yellow-900/20 via-amber-900/10 to-yellow-900/20 backdrop-blur-xl border border-yellow-500/20 shadow-lg shadow-yellow-500/10">
					<CardBody className="flex flex-col items-center justify-center gap-2 p-6">
						<span className="text-4xl">🏆</span>
						<h3 className="text-sm font-medium text-white/60">Winner</h3>
						<p className="text-xl font-bold text-white truncate max-w-full">
							{rankings[0]?.name || "-"}
						</p>
					</CardBody>
				</HeroCard>

				{/* Top Score Card */}
				<HeroCard className="bg-gradient-to-br from-purple-900/20 via-pink-900/10 to-purple-900/20 backdrop-blur-xl border border-purple-500/20 shadow-lg shadow-purple-500/10">
					<CardBody className="flex flex-col items-center justify-center gap-2 p-6">
						<span className="text-4xl">⭐</span>
						<h3 className="text-sm font-medium text-white/60">Top Score</h3>
						<p className="text-xl font-bold text-white">{String(rankings[0]?.rating || 1500)}</p>
					</CardBody>
				</HeroCard>

				{/* Total Names Card */}
				<HeroCard className="bg-gradient-to-br from-blue-900/20 via-cyan-900/10 to-blue-900/20 backdrop-blur-xl border border-blue-500/20 shadow-lg shadow-blue-500/10">
					<CardBody className="flex flex-col items-center justify-center gap-2 p-6">
						<span className="text-4xl">📝</span>
						<h3 className="text-sm font-medium text-white/60">Total Names</h3>
						<p className="text-xl font-bold text-white">{rankings.length}</p>
					</CardBody>
				</HeroCard>
			</div>

			{/* Ranking Adjustment */}
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

			{/* Action Buttons */}
			<div className="flex flex-wrap gap-3 justify-end">
				<HeroButton
					onClick={onStartNew}
					variant="flat"
					className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-white border border-purple-500/30"
					startContent={<Plus size={18} />}
				>
					Start New
				</HeroButton>
				<HeroButton
					variant="flat"
					className="bg-white/5 hover:bg-white/10 text-white border border-white/10"
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
						const url = URL.createObjectURL(blob);
						const link = document.createElement("a");
						link.setAttribute("href", url);
						link.setAttribute(
							"download",
							`cat_names_export_${new Date().toISOString().split("T")[0]}.csv`,
						);
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
 * NameDiscovery Component (From Explore.tsx)
 */
const NameDiscovery: React.FC<{ userName: string }> = ({ userName: _userName }) => {
	const {
		data: popularNames,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["popular-names"],
		queryFn: async () => {
			const names = await coreAPI.getNamesWithDescriptions();
			return names
				.map((name) => ({
					id: name.id,
					name: name.name,
					status: name.status || "candidate",
					provenance: name.provenance || [],
					voteCount: Math.floor(Math.random() * 100) + 1,
					trending: Math.random() > 0.7,
				}))
				.sort((a, b) => b.voteCount - a.voteCount)
				.slice(0, 20);
		},
		staleTime: 5 * 60 * 1000,
	});

	if (isLoading) {
		return <Loading variant="spinner" text="Discovering popular names..." />;
	}

	if (error) {
		return (
			<HeroCard className="max-w-md mx-auto bg-red-500/10 border border-red-500/20">
				<CardBody className="p-6 text-center">
					<p className="text-red-300">
						Unable to load popular names right now. Please try again later.
					</p>
				</CardBody>
			</HeroCard>
		);
	}

	return (
		<div className="flex flex-col gap-6 w-full">
			<div className="flex flex-col gap-1">
				<h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
					Popular Cat Names
				</h2>
				<p className="text-white/60">Discover names loved by the community</p>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
				{popularNames?.map((name, index) => (
					<HeroCard
						key={name.id}
						className={cn(
							"border backdrop-blur-md bg-gradient-to-br from-white/5 to-white/[0.02]",
							"border-white/10 hover:border-purple-500/30 transition-all duration-300",
							name.trending &&
								"ring-1 ring-pink-500/30 shadow-[0_0_15px_-5px_var(--tw-shadow-color)] shadow-pink-500/20",
						)}
						shadow="sm"
					>
						<CardBody className="p-4 flex flex-col gap-3">
							<div className="flex justify-between items-start">
								<Chip
									size="sm"
									variant="flat"
									className="bg-white/10 text-white/80 border border-white/10"
								>
									#{index + 1}
								</Chip>
								{name.trending && (
									<Chip
										size="sm"
										className="bg-pink-500/20 text-pink-300 border border-pink-500/30"
										variant="flat"
										startContent={<TrendingUp size={12} />}
									>
										Trending
									</Chip>
								)}
							</div>

							<h3 className="text-xl font-bold text-white truncate">{name.name}</h3>

							<div className="flex flex-wrap gap-2">
								<Chip
									size="sm"
									variant="dot"
									color={name.status === "candidate" ? "warning" : "success"}
									className="capitalize border-none bg-black/20"
								>
									{name.status}
								</Chip>
								{name.provenance?.length > 0 && (
									<Tooltip
										content={`History: ${name.provenance.map((p: any) => p.action).join(" -> ")}`}
									>
										<Chip size="sm" variant="flat" className="bg-white/5 text-white/50 cursor-help">
											📜 {name.provenance.length}
										</Chip>
									</Tooltip>
								)}
							</div>

							<div className="flex items-center gap-4 text-sm text-white/50 mt-1 pt-2 border-t border-white/5">
								<div className="flex items-center gap-1.5">
									<Heart size={14} className="text-pink-400 fill-pink-400/20" />
									<span className="font-medium">{name.voteCount}</span>
								</div>
								<div className="flex items-center gap-1.5">
									<Users size={14} />
									<span>loved</span>
								</div>
							</div>
						</CardBody>
					</HeroCard>
				))}
			</div>
		</div>
	);
};

/**
 * RandomGenerator Component (From Explore.tsx)
 */
interface GenCategory {
	id: string;
	name: string;
	description: string;
	examples: string[];
	colors: {
		primary: string;
		secondary: string;
	};
}

const GEN_CATEGORIES: GenCategory[] = [
	{
		id: "cute",
		name: "Cute & Adorable",
		description: "Sweet and charming names perfect for cuddly cats",
		examples: ["Whiskers", "Mittens", "Snuggles", "Paws", "Fluffy"],
		colors: {
			primary: "#FF6B9D",
			secondary: "#FFE5F0",
		},
	},
	{
		id: "mysterious",
		name: "Mysterious",
		description: "Enigmatic names for cats with a mysterious aura",
		examples: ["Shadow", "Phantom", "Luna", "Raven", "Ghost"],
		colors: {
			primary: "#6366F1",
			secondary: "#E0E7FF",
		},
	},
	{
		id: "royal",
		name: "Royal & Regal",
		description: "Noble names fit for feline royalty",
		examples: ["Princess", "Duke", "Queen", "Lord", "Emperor"],
		colors: {
			primary: "#F59E0B",
			secondary: "#FEF3C7",
		},
	},
	{
		id: "nature",
		name: "Nature Inspired",
		description: "Names drawn from the beauty of nature",
		examples: ["River", "Forest", "Storm", "Ocean", "Sage"],
		colors: {
			primary: "#10B981",
			secondary: "#D1FAE5",
		},
	},
];

const RandomGenerator: React.FC<{ userName: string }> = ({ userName: _userName }) => {
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [generatedName, setGeneratedName] = useState<string | null>(null);
	const [isGenerating, setIsGenerating] = useState(false);
	const [storedFavorites, setStoredFavorites] = useLocalStorage<string[]>("cat_name_favorites", []);
	const favorites = useMemo(() => new Set(storedFavorites), [storedFavorites]);

	const generateName = async (categoryId?: string) => {
		setIsGenerating(true);
		await new Promise((resolve) => setTimeout(resolve, 800));
		const category = categoryId
			? GEN_CATEGORIES.find((c) => c.id === categoryId)
			: GEN_CATEGORIES[Math.floor(Math.random() * GEN_CATEGORIES.length)];

		if (!category || !category.id) {
			return;
		}
		const randomName =
			category.examples[Math.floor(Math.random() * category.examples.length)] ||
			"No name available";
		setGeneratedName(randomName);
		setSelectedCategory(category.id);
		setIsGenerating(false);
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

	const selectedCategoryData = selectedCategory
		? GEN_CATEGORIES.find((c) => c.id === selectedCategory)
		: null;

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<h2>Random Name Generator</h2>
				<p>Discover creative cat names with a touch of magic</p>
			</div>

			<div className={styles.categoryGrid}>
				<h3>Choose a Theme</h3>
				{GEN_CATEGORIES.map((category) => (
					<Card
						key={category.id}
						className={`${styles.categoryCard} ${selectedCategory === category.id ? styles.selected : ""}`}
						background="glass"
						padding="medium"
						shadow="small"
						onClick={() => generateName(category.id)}
						style={
							{
								"--category-primary": category.colors.primary,
								"--category-secondary": category.colors.secondary,
							} as React.CSSProperties
						}
					>
						<div className={styles.categoryContent}>
							<h4 className={styles.categoryName}>{category.name}</h4>
							<p className={styles.categoryDesc}>{category.description}</p>
							<div className={styles.examples}>
								{category.examples.slice(0, 3).map((example) => (
									<span key={example} className={styles.example}>
										{example}
									</span>
								))}
							</div>
						</div>
					</Card>
				))}
			</div>

			<Card className={styles.generator} background="glass" padding="large" shadow="medium">
				<div className={styles.generatorContent}>
					<div className={styles.result}>
						{isGenerating ? (
							<div className={styles.generating}>
								<Loading variant="spinner" size="small" />
								<p>Generating magical name...</p>
							</div>
						) : generatedName ? (
							<div className={styles.nameResult}>
								<div className={styles.nameDisplay}>
									<h3>{generatedName}</h3>
									{selectedCategoryData && (
										<span
											className={styles.categoryBadge}
											style={{
												backgroundColor: selectedCategoryData.colors.secondary,
												color: selectedCategoryData.colors.primary,
											}}
										>
											{selectedCategoryData.name}
										</span>
									)}
								</div>
								<div className={styles.actions}>
									<Button
										variant="secondary"
										size="small"
										onClick={() => toggleFavorite(generatedName)}
										className={styles.actionBtn}
									>
										<Heart
											size={16}
											className={favorites.has(generatedName) ? styles.favorited : ""}
										/>
									</Button>
									<Button
										variant="secondary"
										size="small"
										onClick={() => copyToClipboard(generatedName)}
										className={styles.actionBtn}
									>
										<Copy size={16} />
									</Button>
								</div>
							</div>
						) : (
							<div className={styles.placeholder}>
								<Shuffle size={32} />
								<p>Select a category or generate randomly</p>
							</div>
						)}
					</div>

					<div>
						<Button
							variant="primary"
							onClick={() => generateName()}
							disabled={isGenerating}
							className={styles.generateBtn}
						>
							{isGenerating ? (
								<>Generating...</>
							) : (
								<>
									<RefreshCw size={18} /> Generate Random
								</>
							)}
						</Button>
					</div>
				</div>
			</Card>

			{favorites.size > 0 && (
				<div className={styles.favorites}>
					<h3>Your Favorites</h3>
					<div className={styles.favoriteList}>
						{Array.from(favorites).map((name) => (
							<div key={name} className={styles.favoriteItem}>
								<span>{name}</span>
								<button
									onClick={() => toggleFavorite(name)}
									className={styles.removeFavorite}
									aria-label={`Remove ${name} from favorites`}
								>
									×
								</button>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

/**
 * CategoryExplorer Component (From Explore.tsx)
 */
interface NameCategory {
	id: string;
	name: string;
	description: string;
	icon: string;
	names: string[];
	color: string;
}

const EXPLORE_CATEGORIES: NameCategory[] = [
	{
		id: "food",
		name: "Food & Sweets",
		description: "Delicious names inspired by tasty treats",
		icon: "🍪",
		names: ["Cookie", "Mochi", "Nacho", "Pickle", "Toffee", "Waffles"],
		color: "#F59E0B",
	},
	{
		id: "nature",
		name: "Nature",
		description: "Names from the beauty of the natural world",
		icon: "🌿",
		names: ["River", "Storm", "Sage", "Willow", "Breeze", "Forest"],
		color: "#10B981",
	},
	{
		id: "colors",
		name: "Colors",
		description: "Vibrant names inspired by colors",
		icon: "🎨",
		names: ["Amber", "Crimson", "Indigo", "Onyx", "Ruby", "Sapphire"],
		color: "#8B5CF6",
	},
	{
		id: "mythical",
		name: "Mythical",
		description: "Magical names from legends and folklore",
		icon: "🧙‍♀️",
		names: ["Phoenix", "Luna", "Atlas", "Nova", "Orion", "Echo"],
		color: "#EC4899",
	},
	{
		id: "cute",
		name: "Adorable",
		description: "Sweet and charming names",
		icon: "🐾",
		names: ["Whiskers", "Mittens", "Snuggles", "Paws", "Fluffy", "Cuddles"],
		color: "#FF6B9D",
	},
	{
		id: "noble",
		name: "Royal",
		description: "Regal names fit for feline royalty",
		icon: "👑",
		names: ["Duke", "Princess", "Lord", "Empress", "Baron", "Queen"],
		color: "#F59E0B",
	},
];

const CategoryExplorer: React.FC<{ userName: string }> = ({ userName: _userName }) => {
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [searchTerm, setSearchTerm] = useState("");

	const { isLoading } = useQuery({
		queryKey: ["all-names"],
		queryFn: () => coreAPI.getNamesWithDescriptions(),
		staleTime: 5 * 60 * 1000,
	});

	const filteredCategories = EXPLORE_CATEGORIES.map((category) => ({
		...category,
		filteredNames: category.names.filter((name) =>
			name.toLowerCase().includes(searchTerm.toLowerCase()),
		),
	})).filter((category) => !searchTerm || category.filteredNames.length > 0);

	const selectedCategoryData = selectedCategory
		? filteredCategories.find((c) => c.id === selectedCategory)
		: null;

	if (isLoading) {
		return <Loading variant="spinner" text="Loading name categories..." />;
	}

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<h2>Category Explorer</h2>
				<p>Browse cat names organized by themes and styles</p>
			</div>
			<div className={styles.controls}>
				<div className={styles.search}>
					<Search size={18} />
					<input
						type="text"
						placeholder="Search names..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className={styles.searchInput}
					/>
				</div>
				<div className={styles.viewToggle}>
					<Button
						variant={viewMode === "grid" ? "primary" : "secondary"}
						size="small"
						onClick={() => setViewMode("grid")}
						className={styles.viewBtn}
					>
						<Grid3X3 size={16} />
					</Button>
					<Button
						variant={viewMode === "list" ? "primary" : "secondary"}
						size="small"
						onClick={() => setViewMode("list")}
						className={styles.viewBtn}
					>
						<List size={16} />
					</Button>
				</div>
			</div>

			{selectedCategory ? (
				<div className={styles.categoryDetail}>
					<div className={styles.detailHeader}>
						<Button
							variant="secondary"
							size="small"
							onClick={() => setSelectedCategory(null)}
							className={styles.backBtn}
						>
							← Back to Categories
						</Button>
						<div className={styles.categoryTitle}>
							<span className={styles.categoryIcon}>{selectedCategoryData?.icon}</span>
							<h2>{selectedCategoryData?.name}</h2>
						</div>
						<p>{selectedCategoryData?.description}</p>
					</div>
					<div className={styles.namesGrid}>
						{selectedCategoryData?.filteredNames.map((name) => (
							<Card
								key={name}
								className={styles.nameCard}
								background="glass"
								padding="medium"
								shadow="small"
							>
								<div className={styles.nameContent}>
									<h4 className={styles.name}>{name}</h4>
									<div className={styles.nameActions}>
										<Button variant="secondary" size="small">
											❤️ Favorite
										</Button>
									</div>
								</div>
							</Card>
						))}
					</div>
				</div>
			) : (
				<div
					className={`${styles.categories} ${viewMode === "list" ? styles.listView : styles.gridView}`}
				>
					{filteredCategories.map((category) => (
						<Card
							key={category.id}
							className={styles.categoryCard}
							background="glass"
							padding="large"
							shadow="small"
							enableTilt={true}
							onClick={() => setSelectedCategory(category.id)}
							style={{ "--category-color": category.color } as React.CSSProperties}
						>
							<div className={styles.categoryContent}>
								<div className={styles.categoryHeader}>
									<div className={styles.categoryIcon}>{category.icon}</div>
									<h3 className={styles.categoryName}>{category.name}</h3>
								</div>
								<p className={styles.categoryDesc}>{category.description}</p>
								<div className={styles.namePreview}>
									{category.filteredNames.slice(0, 4).map((name) => (
										<span key={name} className={styles.nameTag}>
											{name}
										</span>
									))}
									{category.filteredNames.length > 4 && (
										<span className={styles.moreNames}>
											+{category.filteredNames.length - 4} more
										</span>
									)}
								</div>
							</div>
						</Card>
					))}
				</div>
			)}
		</div>
	);
};

/* =========================================================================
   MAIN COMPONENT: Dashboard
   ========================================================================= */

/* =========================================================================
   HistoryView Component
   ========================================================================= */

import { History } from "lucide-react";
import type { VoteData } from "@/types/components";

export const HistoryView: React.FC<{ voteHistory: unknown[] }> = ({ voteHistory }) => {
	const history = (voteHistory as VoteData[]) || [];
	const sortedHistory = [...history].sort(
		(a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
	);

	if (sortedHistory.length === 0) {
		return (
			<Card background="glass" padding="large">
				<div className={styles.emptyState}>
					<History size={48} />
					<h3>No History Yet</h3>
					<p>Start voting to see your tournament history here!</p>
				</div>
			</Card>
		);
	}

	const formatResult = (vote: VoteData) => {
		const left = vote.match.left;
		const right = vote.match.right;

		if (left.outcome === "win" && right.outcome === "win") {
			return <span className={styles.voteBoth}>❤️ Both Liked</span>;
		}
		if (left.outcome === "loss" && right.outcome === "loss") {
			return <span className={styles.voteNeither}>🚫 Neither</span>;
		}
		if (vote.result === -1) {
			return (
				<span className={styles.voteWinner}>
					Winner: <strong>{left.name}</strong>
				</span>
			);
		}
		if (vote.result === 1) {
			return (
				<span className={styles.voteWinner}>
					Winner: <strong>{right.name}</strong>
				</span>
			);
		}
		return <span>Tie</span>;
	};

	return (
		<div className={styles.historyContainer}>
			<div className={styles.header}>
				<h2>Voting History</h2>
				<p>Your recent tournament decisions</p>
			</div>

			<div className={styles.historyList}>
				{sortedHistory.map((vote, i) => (
					<Card key={`${vote.timestamp}-${i}`} className={styles.historyItem} padding="medium">
						<div className={styles.historyContent}>
							<div className={styles.matchup}>
								<span className={vote.match.left.outcome === "win" ? styles.winner : ""}>
									{vote.match.left.name}
								</span>
								<span className={styles.vs}>vs</span>
								<span className={vote.match.right.outcome === "win" ? styles.winner : ""}>
									{vote.match.right.name}
								</span>
							</div>
							<div className={styles.result}>{formatResult(vote)}</div>
							<div className={styles.timestamp}>
								{new Date(vote.timestamp).toLocaleTimeString()}
							</div>
						</div>
					</Card>
				))}
			</div>
		</div>
	);
};

export default function Dashboard({
	personalRatings,
	currentTournamentNames,
	voteHistory,
	onStartNew,
	onUpdateRatings,
	userName,
	defaultTab = "personal",
}: {
	personalRatings: Record<string, unknown> | undefined;
	currentTournamentNames?: NameItem[];
	voteHistory?: unknown[];
	onStartNew: () => void;
	onUpdateRatings: (
		ratings: Record<string, { rating: number; wins?: number; losses?: number }>,
	) => void;
	userName: string | undefined;
	defaultTab?: string;
}) {
	const { toasts, removeToast } = useToast();
	const hasPersonalData = personalRatings && Object.keys(personalRatings).length > 0;

	const tabs = useMemo(
		() => [
			{
				key: "personal",
				label: "My Results",
				icon: <span>🏆</span>,
				content: (
					<PersonalResults
						personalRatings={personalRatings}
						currentTournamentNames={currentTournamentNames}
						voteHistory={voteHistory}
						onStartNew={onStartNew}
						onUpdateRatings={onUpdateRatings}
						userName={userName}
					/>
				),
				disabled: !hasPersonalData,
			},
			{
				key: "history",
				label: "History",
				icon: <History size={16} />,
				content: <HistoryView voteHistory={voteHistory || []} />,
				disabled: !voteHistory || voteHistory.length === 0,
			},
			{
				key: "discover",
				label: "Discover",
				icon: <Sparkles size={16} />,
				content: <NameDiscovery userName={userName || ""} />,
			},
			{
				key: "global",
				label: "Global Stats",
				icon: <TrendingUp size={16} />,
				content: (
					<Suspense fallback={<Loading variant="spinner" text="Loading Stats..." />}>
						<AnalysisDashboard
							userName={userName}
							showGlobalLeaderboard={true}
							defaultCollapsed={false}
						/>
					</Suspense>
				),
			},
			{
				key: "categories",
				label: "Categories",
				icon: <Search size={16} />,
				content: <CategoryExplorer userName={userName || "anonymous"} />,
			},
			{
				key: "random",
				label: "Random",
				icon: <Shuffle size={16} />,
				content: <RandomGenerator userName={userName || "anonymous"} />,
			},
			{
				key: "photos",
				label: "Photos",
				icon: <>🖼️</>,
				content: (
					<Suspense fallback={<Loading variant="spinner" text="Loading Photos..." />}>
						<GalleryView />
					</Suspense>
				),
			},
		],
		[
			hasPersonalData,
			personalRatings,
			currentTournamentNames,
			voteHistory,
			onStartNew,
			onUpdateRatings,
			userName,
		],
	);

	return (
		<div className="relative min-h-screen w-full overflow-hidden">
			{/* Decorative Background Blobs */}
			<div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl -z-10 mix-blend-screen animate-pulse" />
			<div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl -z-10 mix-blend-screen animate-pulse delay-700" />
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pink-600/5 rounded-full blur-[100px] -z-10 mix-blend-screen" />

			<TabContainer
				tabs={tabs}
				defaultActiveTab={hasPersonalData ? "personal" : defaultTab}
				routeSync="/analyze"
				title="Analyze Results"
				subtitle={`Welcome, ${userName}. View your personal rankings, global stats, discover names, and browse the gallery.`}
			/>
			<Toast
				variant="container"
				toasts={toasts}
				removeToast={removeToast}
				position="bottom-right"
			/>
		</div>
	);
}
