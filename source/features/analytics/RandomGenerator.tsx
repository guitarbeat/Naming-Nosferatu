import { CardBody, Button as HeroButton, Spinner } from "@heroui/react";
import { coreAPI } from "@supabase/client";
import React, { useMemo, useState } from "react";
import useLocalStorage from "@/hooks/useBrowserState";
import { Copy, Heart, Shuffle } from "@/icons";
import { Card } from "@/layout/Card";

interface RandomGeneratorProps {
	userName: string;
}

export const RandomGenerator: React.FC<RandomGeneratorProps> = ({ userName: _userName }) => {
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
