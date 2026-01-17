import { useQuery } from "@tanstack/react-query";
import {
	Calendar,
	Copy,
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
import type React from "react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import Button from "../../shared/components/Button";
import Card from "../../shared/components/Card";
import { Loading } from "../../shared/components/Loading";
import { TabContainer } from "../../shared/components/TabContainer";
import { Toast } from "../../shared/components/Toast";
import { useToast } from "../../shared/hooks/useAppHooks";
import { catNamesAPI } from "../../shared/services/supabase/client";
import type { NameItem } from "../../types/components";
import { RankingAdjustment } from "./TournamentViews";
import styles from "./unified.module.css";

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
		<div className={styles.personalResults}>
			<div className={styles.statsGrid}>
				<Card.Stats title="Winner" value={rankings[0]?.name || "-"} emoji="🏆" enableTilt={true} />
				<Card.Stats
					title="Top Score"
					value={String(rankings[0]?.rating || 1500)}
					emoji="⭐"
					enableTilt={true}
				/>
				<Card.Stats title="Total Names" value={rankings.length} emoji="📝" enableTilt={true} />
			</div>

			<RankingAdjustment
				rankings={rankings}
				onSave={async (r: NameItem[]) => {
					const ratingsMap = Object.fromEntries(
						r.map((n) => [n.name, { rating: n.rating as number, wins: n.wins, losses: n.losses }]),
					);
					await onUpdateRatings(ratingsMap);
					showToast({ message: "Updated!", type: "success" });
				}}
				onCancel={onStartNew}
			/>

			<div className={styles.actions}>
				<Button onClick={onStartNew} startIcon={<Plus />}>
					Start New
				</Button>
				<Button
					variant="secondary"
					startIcon={<Calendar />}
					onClick={() => window.alert("Calendar export coming soon!")}
				>
					Export
				</Button>
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
			const names = await catNamesAPI.getNamesWithDescriptions();
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
			<Card background="glass" padding="large">
				<div className={styles.error}>
					<p>Unable to load popular names right now. Please try again later.</p>
				</div>
			</Card>
		);
	}

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<h2>Popular Cat Names</h2>
				<p>Discover names loved by the community</p>
			</div>

			<div className={styles.grid}>
				{popularNames?.map((name, index: number) => (
					<Card
						key={name.id}
						className={`${styles.nameCard} ${name.trending ? styles.trending : ""}`}
						background="glass"
						padding="medium"
						shadow="small"
						enableTilt={true}
					>
						<div className={styles.nameContent}>
							<div className={styles.nameHeader}>
								<span className={styles.rank}>#{index + 1}</span>
								{name.trending && (
									<div className={styles.trendingBadge}>
										<TrendingUp size={12} />
										<span>Trending</span>
									</div>
								)}
							</div>
							<h3 className={styles.name}>{name.name}</h3>

							<div className={styles.lifecycle}>
								<span className={`${styles.statusBadge} ${styles[name.status]}`}>
									{name.status}
								</span>
								{name.provenance?.length > 0 && (
									<div
										className={styles.provenanceGhost}
										title={`History: ${name.provenance.map((p: { action: string }) => p.action).join(" -> ")}`}
									>
										📜 {name.provenance.length}
									</div>
								)}
							</div>

							<div className={styles.stats}>
								<div className={styles.stat}>
									<Heart size={14} />
									<span>{name.voteCount}</span>
								</div>
								<div className={styles.stat}>
									<Users size={14} />
									<span>loved</span>
								</div>
							</div>
						</div>
					</Card>
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
	const [favorites, setFavorites] = useState<Set<string>>(new Set());

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
		setFavorites((prev) => {
			const newFavorites = new Set(prev);
			if (newFavorites.has(name)) {
				newFavorites.delete(name);
			} else {
				newFavorites.add(name);
			}
			return newFavorites;
		});
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
		queryFn: () => catNamesAPI.getNamesWithDescriptions(),
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
   MAIN COMPONENT: UnifiedDashboard
   ========================================================================= */

export default function UnifiedDashboard({
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
	const { toasts, removeToast } = useToast({ maxToasts: 1 });
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
		<>
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
		</>
	);
}
