import { Link } from "react-router-dom"; // Or custom Link if we don't have router
import { useRouting } from "../../../core/hooks/useRouting";
import { MAIN_NAV_ITEMS } from "../../../config/navigation.config";
import "../AppNavbar/AppNavbar.css"; // Reuse nav styles for now or create new

export function Breadcrumbs() {
	const { currentRoute, navigateTo } = useRouting();
    
    // Simple breadcrumb logic based on route segments
    const pathSegments = currentRoute.split('/').filter(Boolean);
    
    // Map segments to readable labels
    const getLabel = (segment: string) => {
        const item = MAIN_NAV_ITEMS.find(i => i.route === `/${segment}` || i.key === segment);
        if (item) return item.label;
        // Check for "analysis=true" param? Breadcrumbs usually purely path based.
        return segment.charAt(0).toUpperCase() + segment.slice(1);
    };

    if (pathSegments.length === 0) return null; // Home

	return (
		<nav aria-label="Breadcrumb" className="breadcrumbs">
			<ol className="breadcrumbs__list">
                <li className="breadcrumbs__item">
                    <button onClick={() => navigateTo('/')} className="breadcrumbs__link">Home</button>
                    <span className="breadcrumbs__separator">/</span>
                </li>
				{pathSegments.map((segment, index) => {
                    const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
                    const isLast = index === pathSegments.length - 1;
                    
					return (
						<li key={path} className="breadcrumbs__item" aria-current={isLast ? "page" : undefined}>
                            {isLast ? (
                                <span className="breadcrumbs__current">{getLabel(segment)}</span>
                            ) : (
                                <>
                                    <button onClick={() => navigateTo(path)} className="breadcrumbs__link">
                                        {getLabel(segment)}
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
