import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Grid3X3, List } from "lucide-react";
import Card from "../../../shared/components/Card/Card";
import Button from "../../../shared/components/Button";
import { Loading } from "../../../shared/components/Loading";
import { catNamesAPI } from "../../../../shared/services/supabase/client";
import styles from "./CategoryExplorer.module.css";

interface CategoryExplorerProps {
	userName: string;
}

interface NameCategory {
	id: string;
	name: string;
	description: string;
	icon: string;
	names: string[];
	color: string;
}

const CATEGORIES: NameCategory[] = [
	{
		id: "food",
		name: "Food & Sweets",
		description: "Delicious names inspired by tasty treats",
		icon: "🍪",
		names: ["Cookie", "Mochi", "Nacho", "Pickle", "Toffee", "Waffles"],
		color: "#F59E0B"
	},
	{
		id: "nature",
		name: "Nature",
		description: "Names from the beauty of the natural world",
		icon: "🌿",
		names: ["River", "Storm", "Sage", "Willow", "Breeze", "Forest"],
		color: "#10B981"
	},
	{
		id: "colors",
		name: "Colors",
		description: "Vibrant names inspired by colors",
		icon: "🎨",
		names: ["Amber", "Crimson", "Indigo", "Onyx", "Ruby", "Sapphire"],
		color: "#8B5CF6"
	},
	{
		id: "mythical",
		name: "Mythical",
		description: "Magical names from legends and folklore",
		icon: "🧙‍♀️",
		names: ["Phoenix", "Luna", "Atlas", "Nova", "Orion", "Echo"],
		color: "#EC4899"
	},
	{
		id: "cute",
		name: "Adorable",
		description: "Sweet and charming names",
		icon: "🐾",
		names: ["Whiskers", "Mittens", "Snuggles", "Paws", "Fluffy", "Cuddles"],
		color: "#FF6B9D"
	},
	{
		id: "noble",
		name: "Royal",
		description: "Regal names fit for feline royalty",
		icon: "👑",
		names: ["Duke", "Princess", "Lord", "Empress", "Baron", "Queen"],
		color: "#F59E0B"
	}
];

export function CategoryExplorer({ userName: _userName }: CategoryExplorerProps) {
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [searchTerm, setSearchTerm] = useState("");

	const { isLoading } = useQuery({
		queryKey: ["all-names"],
		queryFn: () => catNamesAPI.getNames(),
		staleTime: 5 * 60 * 1000,
	});

	const filteredCategories = CATEGORIES.map(category => ({
		...category,
		// Filter names based on search term
		filteredNames: category.names.filter(name =>
			name.toLowerCase().includes(searchTerm.toLowerCase())
		)
	})).filter(category =>
		// Only show categories that have matching names or if no search term
		!searchTerm || category.filteredNames.length > 0
	);

	const selectedCategoryData = selectedCategory
		? filteredCategories.find(c => c.id === selectedCategory)
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

			{!selectedCategory ? (
				<div className={`${styles.categories} ${viewMode === "list" ? styles.listView : styles.gridView}`}>
					{filteredCategories.map(category => (
						<Card
							key={category.id}
							className={styles.categoryCard}
							background="glass"
							padding="large"
							shadow="small"
							onClick={() => setSelectedCategory(category.id)}
							style={{
								"--category-color": category.color
							} as React.CSSProperties}
						>
							<div className={styles.categoryContent}>
								<div className={styles.categoryHeader}>
									<div className={styles.categoryIcon}>
										{category.icon}
									</div>
									<h3 className={styles.categoryName}>{category.name}</h3>
								</div>
								<p className={styles.categoryDesc}>{category.description}</p>
								<div className={styles.namePreview}>
									{category.filteredNames.slice(0, 4).map(name => (
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
			) : (
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
							<span className={styles.categoryIcon}>
								{selectedCategoryData?.icon}
							</span>
							<h2>{selectedCategoryData?.name}</h2>
						</div>
						<p>{selectedCategoryData?.description}</p>
					</div>

					<div className={styles.namesGrid}>
						{selectedCategoryData?.filteredNames.map(name => (
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
			)}
		</div>
	);
}