import { Search, Shuffle, Sparkles, TrendingUp } from "lucide-react";
import { lazy, Suspense, useEffect, useState, useTransition } from "react";
import { useRouting } from "../../core/hooks/useRouting";
import Card from "../../shared/components/Card/Card";
import { Loading } from "../../shared/components/Loading";
import styles from "./Explore.module.css";

const AnalysisDashboard = lazy(() =>
	import("../analytics/components/AnalysisDashboard").then((m) => ({
		default: m.AnalysisDashboard,
	})),
);
const GalleryView = lazy(() => import("../gallery/GalleryView"));
const NameDiscovery = lazy(() => import("./components/NameDiscovery"));
const RandomGenerator = lazy(() => import("./components/RandomGenerator"));
const CategoryExplorer = lazy(() => import("./components/CategoryExplorer"));

interface ExploreProps {
	userName: string;
}

type ExploreTab = "discover" | "random" | "categories" | "stats" | "photos";

export default function Explore({ userName }: ExploreProps) {
	const { currentRoute } = useRouting();
	const [isPending, startTransition] = useTransition();
	const [activeTab, setActiveTab] = useState<ExploreTab>(() => {
		if (currentRoute?.includes("/explore/photos")) {
			return "photos";
		}
		if (currentRoute?.includes("/explore/stats")) {
			return "stats";
		}
		if (currentRoute?.includes("/explore/random")) {
			return "random";
		}
		if (currentRoute?.includes("/explore/categories")) {
			return "categories";
		}
		return "discover";
	});

	const { navigateTo } = useRouting();

	const handleTabChange = (tab: ExploreTab) => {
		startTransition(() => {
			setActiveTab(tab);
			const routes: Record<ExploreTab, string> = {
				discover: "/explore",
				random: "/explore/random",
				categories: "/explore/categories",
				stats: "/explore/stats",
				photos: "/explore/photos",
			};
			navigateTo(routes[tab]);
		});
	};

	// Sync tab with URL changes (e.g. from sidebar)
	useEffect(() => {
		let newTab: ExploreTab = "discover";
		if (currentRoute?.includes("/explore/photos")) {
			newTab = "photos";
		} else if (currentRoute?.includes("/explore/stats")) {
			newTab = "stats";
		} else if (currentRoute?.includes("/explore/random")) {
			newTab = "random";
		} else if (currentRoute?.includes("/explore/categories")) {
			newTab = "categories";
		}

		if (newTab !== activeTab) {
			setActiveTab(newTab);
		}
	}, [currentRoute, activeTab]);

	return (
		<div className={styles.container}>
			<Card
				as="header"
				className={styles.header}
				background="glass"
				padding="large"
				shadow="medium"
			>
				<h2 className={styles.title}>Explore</h2>
				<p className={styles.subtitle}>
					Discover trending names, generate random ideas, and explore categories.
				</p>

				<div className={styles.tabs}>
					<button
						type="button"
						className={`${styles.tabBtn} ${activeTab === "discover" ? styles.active : ""}`}
						onClick={() => handleTabChange("discover")}
						disabled={isPending}
					>
						<Sparkles size={16} />
						<span>Discover</span>
					</button>
					<button
						type="button"
						className={`${styles.tabBtn} ${activeTab === "random" ? styles.active : ""}`}
						onClick={() => handleTabChange("random")}
						disabled={isPending}
					>
						<Shuffle size={16} />
						<span>Random</span>
					</button>
					<button
						type="button"
						className={`${styles.tabBtn} ${activeTab === "categories" ? styles.active : ""}`}
						onClick={() => handleTabChange("categories")}
						disabled={isPending}
					>
						<Search size={16} />
						<span>Categories</span>
					</button>
					<button
						type="button"
						className={`${styles.tabBtn} ${activeTab === "stats" ? styles.active : ""}`}
						onClick={() => handleTabChange("stats")}
						disabled={isPending}
					>
						<TrendingUp size={16} />
						<span>Trends</span>
					</button>
					<button
						type="button"
						className={`${styles.tabBtn} ${activeTab === "photos" ? styles.active : ""}`}
						onClick={() => handleTabChange("photos")}
						disabled={isPending}
					>
						🖼️ Photos
					</button>
				</div>
			</Card>

			<div className={styles.content}>
				<Suspense fallback={<Loading variant="spinner" text={`Loading ${activeTab}...`} />}>
					{activeTab === "discover" && <NameDiscovery userName={userName} />}
					{activeTab === "random" && <RandomGenerator userName={userName} />}
					{activeTab === "categories" && <CategoryExplorer userName={userName} />}
					{activeTab === "stats" && (
						<AnalysisDashboard
							userName={userName}
							showGlobalLeaderboard={true}
							defaultCollapsed={false}
						/>
					)}
					{activeTab === "photos" && <GalleryView />}
				</Suspense>
			</div>
		</div>
	);
}
