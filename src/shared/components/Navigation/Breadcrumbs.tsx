import { MAIN_NAV_ITEMS, type NavItemConfig } from "../../../config/navigation.config";
import { useRouting } from "../../../core/hooks/useRouting";
import "../AppNavbar/AppNavbar.css"; // Reuse nav styles for now

export function Breadcrumbs() {
	const { currentRoute, navigateTo } = useRouting();

	const pathSegments = currentRoute.split("/").filter(Boolean);

	if (pathSegments.length === 0) {
		return null; // Home
	}

	// Helper to find item in config recursively
	const findItem = (
		segments: string[],
		items: NavItemConfig[] = MAIN_NAV_ITEMS,
	): { path: string; label: string }[] => {
		const breadcrumbs: { path: string; label: string }[] = [];
		let currentItems = items;
		let currentPath = "";

		for (const segment of segments) {
			currentPath += `/${segment}`;

			// Try to find a match in the current level of items
			// We check if the item's route matches the current accumulated path
			// OR if the item's key matches the segment (for purely path-based matching)
			const foundItem = currentItems.find(
				(item) => item.route === currentPath || item.key === segment,
			);

			if (foundItem) {
				breadcrumbs.push({
					path: foundItem.route || currentPath,
					label: foundItem.label,
				});
				// Drill down into children if available
				if (foundItem.children) {
					currentItems = foundItem.children;
				} else {
					// No children, stop trying to match from config for deeper levels
					// (But we might continue loop to add generic labels for unknown segments)
					currentItems = [];
				}
			} else {
				// Fallback: Segment not found in config, capitalize it
				breadcrumbs.push({
					path: currentPath,
					label: segment.charAt(0).toUpperCase() + segment.slice(1),
				});
				// Since we lost the trail in config, we can't look for children anymore
				currentItems = [];
			}
		}
		return breadcrumbs;
	};

	const items = findItem(pathSegments);

	return (
		<nav aria-label="Breadcrumb" className="breadcrumbs">
			<ol className="breadcrumbs__list">
				<li className="breadcrumbs__item">
					<button onClick={() => navigateTo("/")} className="breadcrumbs__link">
						Home
					</button>
					<span className="breadcrumbs__separator">/</span>
				</li>
				{items.map((item, index) => {
					const isLast = index === items.length - 1;

					return (
						<li
							key={item.path}
							className="breadcrumbs__item"
							aria-current={isLast ? "page" : undefined}
						>
							{isLast ? (
								<span className="breadcrumbs__current">{item.label}</span>
							) : (
								<>
									<button
										onClick={() => item.path && navigateTo(item.path)}
										className="breadcrumbs__link"
									>
										{item.label}
									</button>
									<span className="breadcrumbs__separator">/</span>
								</>
							)}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
