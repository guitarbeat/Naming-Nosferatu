import { Input, Progress } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { Cat, Filter, RotateCcw, Search } from "lucide-react";
import React, { useEffect } from "react";
import { match } from "ts-pattern";
import Button from "@components/Button/Button";
// import { ComponentTagger } from "lovable-tagger";
import { useMasonryLayout } from "../../shared/hooks/useMasonryLayout";
import { NameCard, OperatorBar, SystemFeed } from "./components/ModernTournamentSetup";
import { TournamentService } from "./services/tournamentService";
import { useTournamentStore } from "./stores/tournamentStore";

// --- Props ---
interface ModernTournamentSetupProps {
	onStart: (selectedNames: unknown) => void;
	userName?: string;
}

export default function ModernTournamentSetup({ onStart, userName }: ModernTournamentSetupProps) {
	const store = useTournamentStore();
	const {
		availableNames,
		selectedNames,
		setAvailableNames,
		toggleNameSelection,
		searchQuery,
		setSearchQuery,
		selectAll,
		clearSelections,
		setOperatorIdentity,
		operatorIdentity,
	} = store;

	// -- Data Fetching --
	const { data: fetchResult, isLoading: isQueryLoading } = useQuery({
		queryKey: ["tournamentNames"],
		queryFn: async () => {
			const result = await TournamentService.fetchActiveNames();
			if (result.isOk()) {
				return result.value;
			}
			throw new Error(result.error?.message ?? "Unknown error occurred"); // Let Query handle error state
		},
	});

	// -- Effects --
	useEffect(() => {
		if (fetchResult) {
			setAvailableNames(fetchResult);
		}
	}, [fetchResult, setAvailableNames]);

	useEffect(() => {
		if (userName && userName !== operatorIdentity) {
			setOperatorIdentity(userName);
		}
	}, [userName, operatorIdentity, setOperatorIdentity]); // Only run when userName prop changes

	const handleStart = () => {
		// Map selected IDs back to objects for the parent component
		const selectedObjects = availableNames.filter((n) => selectedNames.has(n.id));
		onStart(selectedObjects);
	};

	// -- Derived State --
	const filteredNames = React.useMemo(() => {
		if (!searchQuery) {
			return availableNames;
		}
		return availableNames.filter((n) => n.name.toLowerCase().includes(searchQuery.toLowerCase()));
	}, [availableNames, searchQuery]);

	const progress =
		availableNames.length > 0 ? (selectedNames.size / availableNames.length) * 100 : 0;

	const { containerRef, setItemRef, positions, columnHeights } = useMasonryLayout<HTMLDivElement>(
		filteredNames.length,
		{
			minColumnWidth: 180,
			gap: 16,
		},
	);

	// -- Render State Matching --
	const content = match({ isQueryLoading, count: filteredNames.length })
		.with({ isQueryLoading: true }, () => (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin text-purple-500">
					<RotateCcw />
				</div>
			</div>
		))
		.with({ count: 0 }, () => (
			<div className="flex flex-col items-center justify-center h-64 text-slate-500">
				<Cat size={48} className="mb-4 opacity-50" />
				<p>No feline subjects found matching that designation.</p>
			</div>
		))
		.otherwise(() => (
			<div
				ref={containerRef}
				className="relative pb-20"
				style={{
					minHeight: columnHeights.length > 0 ? `${Math.max(...columnHeights)}px` : "auto",
				}}
			>
				<AnimatePresence>
					{filteredNames.map((cat, index) => {
						const position = positions[index];
						return (
							<div
								key={cat.id}
								ref={setItemRef(index)}
								className="w-[180px] sm:w-[160px] md:w-[180px] lg:w-[190px] xl:w-[200px]"
								style={
									position
										? {
												position: "absolute",
												top: `${position.top}px`,
												left: `${position.left}px`,
											}
										: { position: "relative" }
								}
							>
								<NameCard
									cat={cat}
									isSelected={selectedNames.has(cat.id)}
									onToggle={() => toggleNameSelection(cat.id)}
								/>
							</div>
						);
					})}
				</AnimatePresence>
			</div>
		));

	return (
		<div
			className="min-h-screen"
			style={{
				backgroundColor: "var(--color-neutral-900)",
				color: "var(--text-secondary)",
				fontFamily: "var(--font-sans)",
			}}
		>
			{/* lov-tagger hook for interactivity */}
			<div data-lovable-component="ModernTournamentSetup" />

			<OperatorBar />
			<SystemFeed />

			<main className="container mx-auto px-4 py-6 max-w-7xl">
				{/* Toolbar */}
				<div
					className="sticky top-0 z-10 backdrop-blur-xl pb-6 pt-2 space-y-4"
					style={{
						backgroundColor: "color-mix(in srgb, var(--color-neutral-900) 90%, transparent)",
					}}
				>
					<div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
						<div className="w-full md:w-96">
							<Input
								isClearable={true}
								radius="lg"
								classNames={{
									input: [
										"bg-transparent",
										"text-black/90 dark:text-white/90",
										"placeholder:text-default-700/50 dark:placeholder:text-white/60",
									],
									innerWrapper: "bg-transparent",
									inputWrapper: [
										"shadow-xl",
										"bg-default-200/50",
										"dark:bg-default/60",
										"backdrop-blur-xl",
										"backdrop-saturate-200",
										"hover:bg-default-200/70",
										"dark:hover:bg-default/70",
										"group-data-[focus=true]:bg-default-200/50",
										"dark:group-data-[focus=true]:bg-default/60",
										"!cursor-text",
									],
								}}
								placeholder="Search candidates..."
								startContent={
									<Search className="text-black/50 mb-0.5 dark:text-white/90 text-slate-400 pointer-events-none flex-shrink-0" />
								}
								value={searchQuery}
								onValueChange={setSearchQuery}
							/>
						</div>

						<div className="flex gap-2">
							<Button
								size="small"
								variant="secondary"
								startIcon={<Filter size={16} />}
								className="text-slate-300"
								onClick={selectAll}
							>
								Select All
							</Button>
							<Button
								size="small"
								variant="danger"
								startIcon={<RotateCcw size={16} />}
								onClick={clearSelections}
								disabled={selectedNames.size === 0}
							>
								Clear
							</Button>
							<Button
								size="small"
								variant="primary"
								className="font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)]"
								onClick={handleStart}
								disabled={selectedNames.size < 2}
							>
								Start Tournament
							</Button>
						</div>
					</div>

					<div className="space-y-1">
						<div className="flex justify-between text-xs text-slate-400">
							<span>SELECTION PROGRESS</span>
							<span>
								{selectedNames.size} / {availableNames.length} SELECTED
							</span>
						</div>
						<Progress
							size="sm"
							radius="none"
							classNames={{
								base: "max-w-full",
								track: "drop-shadow-md border border-default",
								indicator: "bg-gradient-to-r from-pink-500 to-purple-500",
								label: "tracking-wider font-medium text-default-600",
								value: "text-foreground/60",
							}}
							value={progress}
							aria-label="Selection progress"
						/>
					</div>
				</div>

				{/* Content Grid */}
				<div className="mt-4">{content}</div>
			</main>
		</div>
	);
}
