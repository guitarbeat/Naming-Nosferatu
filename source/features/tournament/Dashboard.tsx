import { TabContainer } from "@components/TabContainer";
import { Toast } from "@components/Toast";
import {
	ButtonGroup,
	CardBody,
	Chip,
	cn,
	Button as HeroButton,
	Card as HeroCard,
	Spinner,
	Tooltip,
} from "@heroui/react";
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
		<div className="flex flex-col gap-8 w-full">
			<div className="flex flex-col gap-1">
				<h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
					Random Name Generator
				</h2>
				<p className="text-white/60">Discover creative cat names with a touch of magic</p>
			</div>

			{/* Category Grid */}
			<div className="flex flex-col gap-4">
				<h3 className="text-lg font-semibold text-white/80">Choose a Theme</h3>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					{GEN_CATEGORIES.map((category) => (
						<HeroCard
							key={category.id}
							isPressable={true}
							onPress={() => generateName(category.id)}
							className={cn(
								"border transition-all duration-300",
								selectedCategory === category.id
									? "ring-2 ring-offset-2 ring-offset-black/50"
									: "hover:scale-105",
							)}
							style={
								{
									borderColor: category.colors.primary,
									backgroundColor: `color-mix(in srgb, ${category.colors.secondary}, transparent 90%)`,
									"--ring-color": category.colors.primary,
								} as React.CSSProperties
							}
						>
							<CardBody className="p-4 flex flex-col gap-2 items-start text-left">
								<h4 className="text-lg font-bold" style={{ color: category.colors.primary }}>
									{category.name}
								</h4>
								<p className="text-xs text-white/60 line-clamp-2 min-h-[2.5em]">
									{category.description}
								</p>
								<div className="flex flex-wrap gap-1 mt-2">
									{category.examples.slice(0, 3).map((ex) => (
										<span
											key={ex}
											className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/50"
										>
											{ex}
										</span>
									))}
								</div>
							</CardBody>
						</HeroCard>
					))}
				</div>
			</div>

			{/* Generator Area */}
			<HeroCard className="w-full min-h-[300px] bg-gradient-to-br from-white/5 to-transparent border border-white/10 relative overflow-hidden">
				<div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px]" />
				<CardBody className="flex flex-col items-center justify-center gap-8 py-12 relative z-10">
					<div className="text-center w-full max-w-md mx-auto min-h-[120px] flex flex-col items-center justify-center">
						{isGenerating ? (
							<div className="flex flex-col items-center gap-4 animate-pulse">
								<Spinner size="lg" color="secondary" />
								<p className="text-purple-300">Generating magical name...</p>
							</div>
						) : generatedName ? (
							<div className="flex flex-col items-center gap-6 w-full animate-in zoom-in-95 duration-300">
								<div className="relative">
									<h3 className="text-5xl md:text-6xl font-black bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent tracking-tight text-center drop-shadow-2xl">
										{generatedName}
									</h3>
									{selectedCategoryData && (
										<Chip
											size="sm"
											variant="flat"
											className="absolute -top-4 -right-8 rotate-12"
											style={{
												backgroundColor: selectedCategoryData.colors.secondary,
												color: selectedCategoryData.colors.primary,
											}}
										>
											{selectedCategoryData.name}
										</Chip>
									)}
								</div>

								<div className="flex gap-2 mt-4">
									<HeroButton
										isIconOnly={true}
										variant="flat"
										className="bg-white/5 hover:bg-white/10 text-white data-[hover=true]:text-pink-400"
										onPress={() => toggleFavorite(generatedName)}
										aria-label="Toggle favorite"
									>
										<Heart
											size={20}
											className={cn(
												"transition-colors",
												favorites.has(generatedName) && "fill-pink-500 text-pink-500",
											)}
										/>
									</HeroButton>
									<HeroButton
										isIconOnly={true}
										variant="flat"
										className="bg-white/5 hover:bg-white/10 text-white"
										onPress={() => copyToClipboard(generatedName)}
										aria-label="Copy to clipboard"
									>
										<Copy size={20} />
									</HeroButton>
								</div>
							</div>
						) : (
							<div className="flex flex-col items-center gap-4 text-white/20">
								<Shuffle size={48} strokeWidth={1} />
								<p className="text-lg">Select a category or generate randomly</p>
							</div>
						)}
					</div>

					<HeroButton
						size="lg"
						className="bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20 font-bold px-8"
						onPress={() => generateName()}
						isDisabled={isGenerating}
						startContent={!isGenerating && <RefreshCw size={20} />}
					>
						{isGenerating ? "Casting Spell..." : "Generate Random"}
					</HeroButton>
				</CardBody>
			</HeroCard>

			{/* Favorites */}
			{favorites.size > 0 && (
				<div className="flex flex-col gap-4">
					<h3 className="text-lg font-semibold text-white/80 flex items-center gap-2">
						<Heart size={16} className="text-pink-500 fill-pink-500" />
						Your Favorites
					</h3>
					<div className="flex flex-wrap gap-2">
						{Array.from(favorites).map((name) => (
							<Chip
								key={name}
								onClose={() => toggleFavorite(name)}
								variant="flat"
								className="bg-white/5 border border-white/10 hover:bg-white/10 transition-colors pl-2"
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
		return (
			<div className="flex justify-center p-12">
				<Spinner size="lg" color="secondary" />
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6 w-full">
			<div className="flex flex-col gap-1">
				<h2 className="text-2xl font-bold text-white">Category Explorer</h2>
				<p className="text-white/60">Browse cat names organized by themes and styles</p>
			</div>

			<div className="flex flex-col md:flex-row gap-4 justify-between items-center sticky top-0 z-10 bg-black/20 backdrop-blur-xl p-4 rounded-xl border border-white/5">
				<div className="relative w-full md:w-64">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
					<input
						type="text"
						placeholder="Search names..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder:text-white/40 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
					/>
				</div>

				<div className="flex gap-2">
					<ButtonGroup variant="flat" className="bg-white/5 rounded-lg p-1">
						<HeroButton
							size="sm"
							isIconOnly={true}
							className={cn(
								viewMode === "grid" ? "bg-white/10 text-white" : "text-white/50 hover:text-white",
							)}
							onPress={() => setViewMode("grid")}
						>
							<Grid3X3 size={18} />
						</HeroButton>
						<HeroButton
							size="sm"
							isIconOnly={true}
							className={cn(
								viewMode === "list" ? "bg-white/10 text-white" : "text-white/50 hover:text-white",
							)}
							onPress={() => setViewMode("list")}
						>
							<List size={18} />
						</HeroButton>
					</ButtonGroup>
				</div>
			</div>

			{selectedCategory ? (
				<div className="flex flex-col gap-6 animate-in slide-in-from-right duration-300">
					<div className="flex items-center gap-4 border-b border-white/10 pb-4">
						<HeroButton
							variant="light"
							onPress={() => setSelectedCategory(null)}
							startContent={<span className="text-lg">←</span>}
							className="text-white/60 hover:text-white"
						>
							Back
						</HeroButton>
						<div>
							<div className="flex items-center gap-2">
								<span className="text-2xl">{selectedCategoryData?.icon}</span>
								<h2 className="text-2xl font-bold text-white">{selectedCategoryData?.name}</h2>
							</div>
							<p className="text-white/60 text-sm">{selectedCategoryData?.description}</p>
						</div>
					</div>

					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
						{selectedCategoryData?.filteredNames.map((name) => (
							<HeroCard
								key={name}
								isPressable={true}
								className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/30 transition-all"
							>
								<CardBody className="p-3 flex flex-row justify-between items-center gap-2">
									<span className="font-medium text-white truncate">{name}</span>
									<HeroButton
										isIconOnly={true}
										size="sm"
										variant="light"
										className="text-white/20 hover:text-pink-500 min-w-8 w-8 h-8"
										aria-label="Favorite"
									>
										<Heart size={16} />
									</HeroButton>
								</CardBody>
							</HeroCard>
						))}
					</div>
				</div>
			) : (
				<div
					className={cn(
						"grid gap-4",
						viewMode === "grid"
							? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
							: "grid-cols-1",
					)}
				>
					{filteredCategories.map((category) => (
						<HeroCard
							key={category.id}
							isPressable={true}
							onPress={() => setSelectedCategory(category.id)}
							className={cn(
								"border group transition-all duration-300",
								viewMode === "list" ? "flex-row items-center" : "flex-col",
							)}
							style={
								{
									borderColor: category.color,
									backgroundColor: `color-mix(in srgb, ${category.color}, transparent 95%)`,
								} as React.CSSProperties
							}
						>
							<CardBody
								className={cn("p-5 gap-4", viewMode === "list" && "flex-row items-center w-full")}
							>
								<div className="flex items-center gap-3 min-w-[200px]">
									<div className="text-3xl p-3 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform">
										{category.icon}
									</div>
									<div>
										<h3
											className="text-lg font-bold text-white group-hover:text-[var(--category-color)]"
											style={{ "--category-color": category.color } as React.CSSProperties}
										>
											{category.name}
										</h3>
										<p className="text-xs text-white/50 line-clamp-1">{category.description}</p>
									</div>
								</div>

								<div
									className={cn(
										"flex flex-wrap gap-1.5",
										viewMode === "list" ? "flex-1 justify-end" : "mt-auto",
									)}
								>
									{category.filteredNames.slice(0, viewMode === "list" ? 8 : 4).map((name) => (
										<Chip
											key={name}
											size="sm"
											variant="flat"
											className="bg-white/10 text-white/70 border border-white/5"
										>
											{name}
										</Chip>
									))}
									{category.filteredNames.length > (viewMode === "list" ? 8 : 4) && (
										<span className="text-xs text-white/40 self-center px-1">
											+{category.filteredNames.length - (viewMode === "list" ? 8 : 4)} More
										</span>
									)}
								</div>
							</CardBody>
						</HeroCard>
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
			<HeroCard className="max-w-md mx-auto bg-white/5 border border-white/10">
				<CardBody className="p-12 flex flex-col items-center text-center gap-4 text-white/40">
					<History size={48} />
					<div className="flex flex-col gap-1">
						<h3 className="text-xl font-bold text-white/60">No History Yet</h3>
						<p>Start voting to see your tournament history here!</p>
					</div>
				</CardBody>
			</HeroCard>
		);
	}

	const formatResult = (vote: VoteData) => {
		const left = vote.match.left;
		const right = vote.match.right;

		if (left.outcome === "win" && right.outcome === "win") {
			return (
				<Chip color="danger" variant="flat" size="sm">
					❤️ Both Liked
				</Chip>
			);
		}
		if (left.outcome === "loss" && right.outcome === "loss") {
			return (
				<Chip color="default" variant="flat" size="sm">
					🚫 Neither
				</Chip>
			);
		}
		if (vote.result === -1) {
			return (
				<span className="text-green-400 font-bold flex items-center gap-1">
					Winner: <span className="text-white">{left.name}</span>
				</span>
			);
		}
		if (vote.result === 1) {
			return (
				<span className="text-green-400 font-bold flex items-center gap-1">
					Winner: <span className="text-white">{right.name}</span>
				</span>
			);
		}
		return (
			<Chip variant="flat" size="sm">
				Tie
			</Chip>
		);
	};

	return (
		<div className="flex flex-col gap-6 w-full">
			<div className="flex flex-col gap-1">
				<h2 className="text-2xl font-bold text-white">Voting History</h2>
				<p className="text-white/60">Your recent tournament decisions</p>
			</div>

			<div className="flex flex-col gap-3">
				{sortedHistory.map((vote, i) => (
					<HeroCard key={`${vote.timestamp}-${i}`} className="bg-white/5 border border-white/5 p-2">
						<CardBody className="p-3 grid grid-cols-1 md:grid-cols-3 items-center gap-4">
							{/* Matchup */}
							<div className="flex items-center justify-center md:justify-start gap-3 text-lg">
								<span
									className={cn(
										"font-medium transition-colors",
										vote.match.left.outcome === "win"
											? "text-green-400 font-bold"
											: "text-white/60",
									)}
								>
									{vote.match.left.name}
								</span>
								<span className="text-white/20 text-sm">vs</span>
								<span
									className={cn(
										"font-medium transition-colors",
										vote.match.right.outcome === "win"
											? "text-green-400 font-bold"
											: "text-white/60",
									)}
								>
									{vote.match.right.name}
								</span>
							</div>

							{/* Result */}
							<div className="flex justify-center">{formatResult(vote)}</div>

							{/* Time */}
							<div className="text-center md:text-right text-xs text-white/30 font-mono">
								{new Date(vote.timestamp).toLocaleTimeString()}
							</div>
						</CardBody>
					</HeroCard>
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
				subtitle={`Welcome, ${userName}. View your personal rankings, global stats, and discover names.`}
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
