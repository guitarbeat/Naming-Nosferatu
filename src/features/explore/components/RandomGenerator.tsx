import { useState } from "react";
import { Shuffle, RefreshCw, Heart, Copy } from "lucide-react";
import Card from "../../../shared/components/Card/Card";
import Button from "../../../shared/components/Button";
import { Loading } from "../../../shared/components/Loading";
import styles from "./RandomGenerator.module.css";

interface RandomGeneratorProps {
	userName: string;
}

interface NameCategory {
	id: string;
	name: string;
	description: string;
	examples: string[];
	colors: {
		primary: string;
		secondary: string;
	};
}

const CATEGORIES: NameCategory[] = [
	{
		id: "cute",
		name: "Cute & Adorable",
		description: "Sweet and charming names perfect for cuddly cats",
		examples: ["Whiskers", "Mittens", "Snuggles", "Paws", "Fluffy"],
		colors: {
			primary: "#FF6B9D",
			secondary: "#FFE5F0"
		}
	},
	{
		id: "mysterious",
		name: "Mysterious",
		description: "Enigmatic names for cats with a mysterious aura",
		examples: ["Shadow", "Phantom", "Luna", "Raven", "Ghost"],
		colors: {
			primary: "#6366F1",
			secondary: "#E0E7FF"
		}
	},
	{
		id: "royal",
		name: "Royal & Regal",
		description: "Noble names fit for feline royalty",
		examples: ["Princess", "Duke", "Queen", "Lord", "Emperor"],
		colors: {
			primary: "#F59E0B",
			secondary: "#FEF3C7"
		}
	},
	{
		id: "nature",
		name: "Nature Inspired",
		description: "Names drawn from the beauty of nature",
		examples: ["River", "Forest", "Storm", "Ocean", "Sage"],
		colors: {
			primary: "#10B981",
			secondary: "#D1FAE5"
		}
	}
];

function RandomGenerator({ userName: _userName }: RandomGeneratorProps) {
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [generatedName, setGeneratedName] = useState<string | null>(null);
	const [isGenerating, setIsGenerating] = useState(false);
	const [favorites, setFavorites] = useState<Set<string>>(new Set());

	const generateName = async (categoryId?: string) => {
		setIsGenerating(true);

		// Simulate API delay
		await new Promise(resolve => setTimeout(resolve, 800));

		const category = categoryId
			? CATEGORIES.find(c => c.id === categoryId)
			: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

		if (!category || !category.id) {
			return;
		}

		const randomName = category.examples[Math.floor(Math.random() * category.examples.length)];
		setGeneratedName(randomName);
		setSelectedCategory(category.id);
		setIsGenerating(false);
	};

	const copyToClipboard = async (name: string) => {
		try {
			await navigator.clipboard.writeText(name);
			// Could add a toast notification here
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const toggleFavorite = (name: string) => {
		setFavorites(prev => {
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
		? CATEGORIES.find(c => c.id === selectedCategory)
		: null;

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<h2>Random Name Generator</h2>
				<p>Discover creative cat names with a touch of magic</p>
			</div>

			<div className={styles.categories}>
				<h3>Choose a Theme</h3>
				<div className={styles.categoryGrid}>
					{CATEGORIES.map(category => (
						<Card
							key={category.id}
							className={`${styles.categoryCard} ${selectedCategory === category.id ? styles.selected : ""}`}
							background="glass"
							padding="medium"
							shadow="small"
							onClick={() => generateName(category.id)}
							style={{
								"--category-primary": category.colors.primary,
								"--category-secondary": category.colors.secondary
							} as React.CSSProperties}
						>
							<div className={styles.categoryContent}>
								<h4 className={styles.categoryName}>{category.name}</h4>
								<p className={styles.categoryDesc}>{category.description}</p>
								<div className={styles.examples}>
									{category.examples.slice(0, 3).map(example => (
										<span key={example} className={styles.example}>
											{example}
										</span>
									))}
								</div>
							</div>
						</Card>
					))}
				</div>
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
												color: selectedCategoryData.colors.primary
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

					<div className={styles.controls}>
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
									<RefreshCw size={18} />
									Generate Random
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
						{Array.from(favorites).map(name => (
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
}

export default RandomGenerator;