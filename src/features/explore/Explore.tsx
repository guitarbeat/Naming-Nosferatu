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

interface ExploreProps {
	userName: string;
}

export default function Explore({ userName }: ExploreProps) {
	const { currentRoute } = useRouting();
	const [isPending, startTransition] = useTransition();
	const [activeTab, setActiveTab] = useState<"stats" | "photos">(() => {
		if (currentRoute?.includes("/explore/photos")) {
			return "photos";
		}
		return "stats";
	});

	const { navigateTo } = useRouting();

	const handleTabChange = (tab: "stats" | "photos") => {
		startTransition(() => {
			setActiveTab(tab);
			navigateTo(tab === "photos" ? "/explore/photos" : "/explore/stats");
		});
	};

	// Sync tab with URL changes (e.g. from sidebar)
	useEffect(() => {
		if (currentRoute?.includes("/explore/photos") && activeTab !== "photos") {
			setActiveTab("photos");
		} else if (currentRoute?.includes("/explore/stats") && activeTab !== "stats") {
			setActiveTab("stats");
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
				<p className={styles.subtitle}>Discover global trends and browse the cat gallery.</p>

				<div className={styles.tabs}>
					<button
						type="button"
						className={`${styles.tabBtn} ${activeTab === "stats" ? styles.active : ""}`}
						onClick={() => handleTabChange("stats")}
						disabled={isPending}
					>
						📊 Statistics
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
					{activeTab === "stats" ? (
						<AnalysisDashboard
							userName={userName}
							showGlobalLeaderboard={true}
							defaultCollapsed={false}
						/>
					) : (
						<GalleryView />
					)}
				</Suspense>
			</div>
		</div>
	);
}
