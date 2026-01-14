import { Search, Shuffle, Sparkles, TrendingUp } from "lucide-react";
import { lazy, Suspense } from "react";
import { Loading } from "../../shared/components/Loading";
import { TabContainer } from "../../shared/components/TabContainer";

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

export default function Explore({ userName }: ExploreProps) {
	const tabs = [
		{
			key: "discover",
			label: "Discover",
			icon: <Sparkles size={16} />,
			content: (
				<Suspense fallback={<Loading variant="spinner" text="Loading Discover..." />}>
					<NameDiscovery userName={userName} />
				</Suspense>
			),
		},
		{
			key: "random",
			label: "Random",
			icon: <Shuffle size={16} />,
			content: (
				<Suspense fallback={<Loading variant="spinner" text="Loading Random..." />}>
					<RandomGenerator userName={userName} />
				</Suspense>
			),
		},
		{
			key: "categories",
			label: "Categories",
			icon: <Search size={16} />,
			content: (
				<Suspense fallback={<Loading variant="spinner" text="Loading Categories..." />}>
					<CategoryExplorer userName={userName} />
				</Suspense>
			),
		},
		{
			key: "stats",
			label: "Trends",
			icon: <TrendingUp size={16} />,
			content: (
				<Suspense fallback={<Loading variant="spinner" text="Loading Trends..." />}>
					<AnalysisDashboard
						userName={userName}
						showGlobalLeaderboard={true}
						defaultCollapsed={false}
					/>
				</Suspense>
			),
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
	];

	return (
		<TabContainer
			tabs={tabs}
			defaultActiveTab="discover"
			routeSync="/explore"
			title="Explore"
			subtitle="Discover trending names, generate random ideas, and explore categories."
		/>
	);
}
