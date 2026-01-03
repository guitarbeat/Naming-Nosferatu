import { Button, Card, CardBody, Chip, Input, Progress } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
	Cat,
	ChevronRight,
	Filter,
	RotateCcw,
	Search,
	Sparkles,
	Trophy,
	User,
} from "lucide-react";
import React, { useEffect } from "react";
import { match } from "ts-pattern";
import { cn } from "../../shared/utils/core";
import { type CatName, TournamentService } from "./services/tournamentService";
import { useTournamentStore } from "./stores/tournamentStore";

// --- Components ---

const OperatorBar = () => {
	const { operatorIdentity, setOperatorIdentity } = useTournamentStore();
	const [isEditing, setIsEditing] = React.useState(false);
	const [tempName, setTempName] = React.useState(operatorIdentity);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setOperatorIdentity(tempName);
		setIsEditing(false);
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: -20 }}
			animate={{ opacity: 1, y: 0 }}
			className="bg-slate-900 border-b border-white/10 p-4 flex items-center justify-between"
		>
			<div className="flex items-center gap-3">
				<div className="bg-purple-500/20 p-2 rounded-lg">
					<User className="w-5 h-5 text-purple-400" />
				</div>
				<div className="flex flex-col">
					<span className="text-[10px] uppercase tracking-wider text-slate-400">
						Operator Identity
					</span>
					{isEditing ? (
						<form onSubmit={handleSubmit} className="flex gap-2 items-center">
							<input
								autoFocus
								value={tempName}
								onChange={(e) => setTempName(e.target.value)}
								onBlur={handleSubmit}
								className="bg-transparent border-b border-purple-500 text-white focus:outline-none text-sm font-mono"
							/>
						</form>
					) : (
						<div
							className="flex items-center gap-2 cursor-pointer group"
							onClick={() => setIsEditing(true)}
						>
							<span className="text-white font-mono">{operatorIdentity}</span>
							<span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
								[EDIT]
							</span>
						</div>
					)}
				</div>
			</div>
			<Chip
				variant="flat"
				color="secondary"
				startContent={<Sparkles size={12} />}
				classNames={{ base: "bg-purple-900/30 border border-purple-500/20" }}
			>
				<span className="text-xs">System Online</span>
			</Chip>
		</motion.div>
	);
};

const SystemFeed = () => {
	return (
		<div className="bg-amber-900/10 border-y border-amber-500/10 py-2 px-4 overflow-hidden relative">
			<div className="absolute top-0 left-0 w-1 h-full bg-amber-500/50" />
			<motion.div
				animate={{ x: ["100%", "-100%"] }}
				transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
				className="whitespace-nowrap flex gap-8 text-[10px] font-mono text-amber-200/70"
			>
				<span>SYSTEM_FEED: INITIATING NAME PROTOCOL...</span>
				<span>Scanning database for optimal feline designations {"//"}</span>
				<span>Awaiting operator input...</span>
				<span>Did you know? Cats spend 70% of their lives sleeping.</span>
			</motion.div>
		</div>
	);
};

const NameCard = ({
	cat,
	isSelected,
	onToggle,
}: {
	cat: CatName;
	isSelected: boolean;
	onToggle: () => void;
}) => {
	return (
		<motion.div
			layout
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			whileHover={{ scale: 1.02 }}
			whileTap={{ scale: 0.98 }}
		>
			<Card
				isPressable
				onPress={onToggle}
				className={cn(
					"w-full h-full min-h-[140px] border transition-all duration-200",
					isSelected
						? "border-purple-500 bg-purple-900/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
						: "border-white/5 bg-slate-900/50 hover:bg-slate-800/50 hover:border-white/10",
				)}
			>
				<CardBody className="flex flex-col justify-between p-4">
					<div>
						<div className="flex justify-between items-start mb-2">
							<h3
								className={cn(
									"text-lg font-bold font-mono",
									isSelected ? "text-purple-300" : "text-slate-200",
								)}
							>
								{cat.name.toUpperCase()}
							</h3>
							{isSelected && (
								<motion.div
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									className="bg-purple-500 rounded-full p-1"
								>
									<Trophy size={10} className="text-white" />
								</motion.div>
							)}
						</div>
						{cat.description && (
							<p className="text-xs text-slate-400 line-clamp-3">
								{cat.description}
							</p>
						)}
					</div>
					<div className="mt-4 flex gap-2">
						{cat.avg_rating && (
							<div className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400">
								RAT: {Math.round(cat.avg_rating)}
							</div>
						)}
					</div>
				</CardBody>
			</Card>
		</motion.div>
	);
};

// --- Props ---
interface ModernTournamentSetupProps {
	onStart: (selectedNames: unknown) => void;
	userName?: string;
}

export default function ModernTournamentSetup({
	onStart,
	userName,
}: ModernTournamentSetupProps) {
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
	const { data: activeNames, isLoading: isQueryLoading } = useQuery({
		queryKey: ["tournamentNames"],
		queryFn: async () => {
			const result = await TournamentService.fetchActiveNames();
			if (result.isOk()) {
				return result.value;
			}
			throw new Error(result.error.message); // Let Query handle error state
		},
	});

	// -- Effects --
	useEffect(() => {
		if (activeNames) {
			setAvailableNames(activeNames);
		}
	}, [activeNames, setAvailableNames]);

	useEffect(() => {
		if (userName && userName !== operatorIdentity) {
			setOperatorIdentity(userName);
		}
	}, [userName, operatorIdentity, setOperatorIdentity]); // Only run when userName prop changes

	const handleStart = () => {
		// Map selected IDs back to objects for the parent component
		const selectedObjects = availableNames.filter((n) =>
			selectedNames.has(n.id),
		);
		onStart(selectedObjects);
	};

	// -- Derived State --
	const filteredNames = React.useMemo(() => {
		if (!searchQuery) return availableNames;
		return availableNames.filter((n) =>
			n.name.toLowerCase().includes(searchQuery.toLowerCase()),
		);
	}, [availableNames, searchQuery]);

	const progress =
		availableNames.length > 0
			? (selectedNames.size / availableNames.length) * 100
			: 0;

	// -- Render State Matching --
	const gridContent = match({ isQueryLoading, count: filteredNames.length })
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
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
				<AnimatePresence mode="popLayout">
					{filteredNames.map((cat) => (
						<NameCard
							key={cat.id}
							cat={cat}
							isSelected={selectedNames.has(cat.id)}
							onToggle={() => toggleNameSelection(cat.id)}
						/>
					))}
				</AnimatePresence>
			</div>
		));

	return (
		<div className="min-h-screen bg-[#050b16] text-slate-200 font-sans selection:bg-purple-500/30">
			{/* lov-tagger hook for interactivity */}
			<div data-lovable-component="ModernTournamentSetup" />

			<OperatorBar />
			<SystemFeed />

			<main className="container mx-auto px-4 py-6 max-w-7xl">
				{/* Toolbar */}
				<div
					className="sticky z-10 bg-[#050b16]/90 backdrop-blur-xl pb-6 pt-2 space-y-4"
					style={{ top: "var(--app-navbar-offset, 0px)" }}
				>
					<div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
						<div className="w-full md:w-96">
							<Input
								isClearable
								radius="lg"
								classNames={{
									input: [
										"bg-transparent",
										"text-white",
										"placeholder:text-slate-500",
									],
									innerWrapper: "bg-transparent",
									inputWrapper: [
										"shadow-xl",
										"bg-slate-900/50",
										"border border-white/10",
										"backdrop-blur-xl",
										"hover:bg-slate-800/50",
										"group-data-[focus=true]:border-purple-500/50",
										"!cursor-text",
									],
								}}
								placeholder="Search candidates..."
								startContent={
									<Search className="text-slate-400 mb-0.5 pointer-events-none flex-shrink-0 w-4 h-4" />
								}
								value={searchQuery}
								onValueChange={setSearchQuery}
							/>
						</div>

						<div className="flex gap-2">
							<Button
								size="sm"
								variant="flat"
								color="default"
								startContent={<Filter size={16} />}
								className="text-slate-300 border border-white/5 hover:border-white/20"
								onPress={selectAll}
							>
								Select All
							</Button>
							<Button
								size="sm"
								variant="flat"
								color="danger"
								startContent={<RotateCcw size={16} />}
								onPress={clearSelections}
								isDisabled={selectedNames.size === 0}
								className="border border-red-500/20"
							>
								Clear
							</Button>
							<Button
								size="sm"
								color="secondary"
								endContent={<ChevronRight size={16} />}
								className="font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)] bg-purple-600 hover:bg-purple-500"
								onPress={handleStart}
								isDisabled={selectedNames.size < 2}
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
								track: "bg-slate-800 border border-white/5",
								indicator: "bg-gradient-to-r from-purple-600 to-pink-500",
							}}
							value={progress}
							aria-label="Selection progress"
						/>
					</div>
				</div>

				{/* Content Grid */}
				<div className="mt-4">{gridContent}</div>
			</main>
		</div>
	);
}
