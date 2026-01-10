import { memo } from "react";
import { useRouting } from "../../../core/hooks/useRouting";
import { MAIN_NAV_ITEMS } from "../../navigation";

export const SubNavigation = memo(function SubNavigation() {
	const { currentRoute, navigateTo } = useRouting();

	// Find the active primary item
	const activePrimaryItem = MAIN_NAV_ITEMS.find((item) => {
		if (item.route === "/") {
			return currentRoute === "/";
		}
		return item.route && currentRoute.startsWith(item.route);
	});

	// If no children or no active primary item, don't render sub-nav
	if (!activePrimaryItem?.children || activePrimaryItem.children.length === 0) {
		return null;
	}

	return (
		<nav className="sub-navigation" aria-label="Secondary navigation">
			<ul className="sub-navigation__list">
				{activePrimaryItem.children.map((child) => {
					const isActive = child.route === currentRoute;

					return (
						<li key={child.key} className="sub-navigation__item">
							<button
								className={`sub-navigation__link ${isActive ? "active" : ""}`}
								onClick={() => child.route && navigateTo(child.route)}
								aria-current={isActive ? "page" : undefined}
							>
								{child.label}
							</button>
						</li>
					);
				})}
			</ul>
		</nav>
	);
});
