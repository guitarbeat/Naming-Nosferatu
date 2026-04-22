import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import Button from "@/shared/components/layout/Button";
import CatImage from "@/shared/components/layout/CatImage";
import { CAT_IMAGES } from "@/shared/lib/constants";
import { BarChart3, Target, Trophy } from "@/shared/lib/icons";
import type { NameItem } from "@/shared/types";

interface HomeHeroSectionProps {
	lockedNames: NameItem[];
	selectedCount: number;
	totalNameCount: number;
	onStartPicking: () => void;
	onSeeResults: () => void;
}

function CyclingName({ names }: { names: string[] }) {
	const displayNames = names.length > 0 ? names : ["Woods"];
	const [index, setIndex] = useState(0);

	useEffect(() => {
		if (displayNames.length <= 1) return;
		const id = setInterval(() => {
			setIndex((i) => (i + 1) % displayNames.length);
		}, 2200);
		return () => clearInterval(id);
	}, [displayNames.length]);

	return (
		<span className="relative inline-block">
			<AnimatePresence mode="wait">
				<motion.span
					key={displayNames[index]}
					className="inline-block font-black italic text-white"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -20 }}
					transition={{ duration: 0.35, ease: "easeInOut" }}
				>
					{displayNames[index]}
				</motion.span>
			</AnimatePresence>
		</span>
	);
}

export function HomeHeroSection({
	lockedNames,
	selectedCount,
	totalNameCount,
	onStartPicking,
	onSeeResults,
}: HomeHeroSectionProps) {
	const candidateNames = lockedNames.map((n) => n.name);
	const lockedPreview = lockedNames.slice(0, 3).map((name) => name.name);
	const heroImage = CAT_IMAGES[8] ?? CAT_IMAGES[0] ?? "";
	const heroStats = [
		{ icon: Target, label: "Selected", value: selectedCount },
		{ icon: Trophy, label: "Locked", value: lockedNames.length },
		{ icon: BarChart3, label: "Pool", value: totalNameCount },
	] as const;

	return (
		<section className="home-hero-section relative isolate flex min-h-dvh w-full overflow-hidden">
			<div className="absolute inset-0">
				<CatImage
					src={heroImage}
					alt="Featured cat"
					loading="eager"
					containerClassName="h-full w-full"
					imageClassName="h-full w-full scale-[1.03] object-cover"
				/>
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.2),transparent_42%)]" />
				<div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/45 to-background" />
			</div>

			<div className="home-hero-inner relative z-10 mx-auto flex min-h-[inherit] w-full items-end">
				<div className="home-hero-copy mx-auto flex w-full max-w-6xl flex-col gap-5 text-left sm:gap-7">
					<motion.div
						initial={{ opacity: 0, y: 18 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.45, ease: "easeOut" }}
						className="max-w-2xl space-y-4"
					>
						<p className="inline-flex w-fit items-center rounded-full border border-white/14 bg-black/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/78 backdrop-blur-md">
							Naming Nosferatu
						</p>

						<div className="space-y-3">
							<p className="text-sm font-medium uppercase tracking-[0.18em] text-white/60">
								Build the shortlist on your phone
							</p>
							<h1 className="font-display text-[clamp(3.5rem,16vw,8rem)] leading-[0.92] tracking-[-0.055em] text-white">
								My cat&apos;s name is{" "}
								<span className="block text-white/92">
									<CyclingName names={candidateNames} />
								</span>
							</h1>
							<p className="max-w-xl text-sm leading-relaxed text-white/72 sm:text-base">
								Lock in the contenders, run the bracket, and compare your
								personal picks with the wider pool without fighting a cramped
								mobile layout.
							</p>
						</div>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.08, duration: 0.45, ease: "easeOut" }}
						className="flex flex-col gap-3 sm:flex-row sm:items-center"
					>
						<Button
							variant="glass"
							size="xl"
							onClick={onStartPicking}
							className="w-full sm:w-auto"
						>
							Start Picking
						</Button>
						<Button
							variant="outline"
							size="xl"
							onClick={onSeeResults}
							className="w-full border-white/18 bg-black/20 text-white hover:bg-white/12 hover:text-white sm:w-auto"
						>
							See Results
						</Button>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 24 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.16, duration: 0.5, ease: "easeOut" }}
						className="grid gap-4 rounded-[1.6rem] border border-white/10 bg-black/28 p-4 backdrop-blur-md sm:p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"
					>
						<div className="space-y-3">
							<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/62">
								Locked Into Every Bracket
							</p>
							{lockedPreview.length > 0 ? (
								<div className="flex flex-wrap gap-2">
									{lockedPreview.map((name) => (
										<span
											key={name}
											className="rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-sm font-medium text-white/88"
										>
											{name}
										</span>
									))}
									{lockedNames.length > lockedPreview.length && (
										<span className="rounded-full border border-white/10 bg-black/18 px-3 py-1.5 text-sm text-white/60">
											+{lockedNames.length - lockedPreview.length} more
										</span>
									)}
								</div>
							) : (
								<p className="max-w-lg text-sm leading-relaxed text-white/68">
									No names are locked yet. Start with the picker to build a
									shortlist that feels strong on mobile before the bracket
									begins.
								</p>
							)}
						</div>

						<div className="grid grid-cols-3 gap-2 sm:gap-3">
							{heroStats.map(({ icon: Icon, label, value }) => (
								<div
									key={label}
									className="min-w-[5.25rem] rounded-2xl border border-white/10 bg-black/22 px-3 py-3"
								>
									<Icon className="h-4 w-4 text-white/72" />
									<p className="mt-3 text-[1.65rem] font-semibold leading-none text-white">
										{value}
									</p>
									<p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
										{label}
									</p>
								</div>
							))}
						</div>
					</motion.div>
				</div>
			</div>
		</section>
	);
}
