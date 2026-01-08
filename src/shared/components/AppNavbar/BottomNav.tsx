import { motion } from "framer-motion";
import { BOTTOM_NAV_ITEMS, MAIN_NAV_ITEMS } from "../../../config/navigation.config";
import { useRouting } from "../../../core/hooks/useRouting";
import "./AppNavbar.css"; // Reuse existing styles or create new

export function BottomNav() {
	const { currentRoute, navigateTo } = useRouting();

	const items = BOTTOM_NAV_ITEMS.map((key) =>
		MAIN_NAV_ITEMS.find((item) => item.key === key),
	).filter((item): item is (typeof MAIN_NAV_ITEMS)[0] => Boolean(item));

	if (!items.length) {
		return null;
	}

	const handleNavClick = (route?: string) => {
		if (navigator.vibrate) {
			navigator.vibrate(10);
		}
		if (route) {
			navigateTo(route);
		}
	};

	return (
		<motion.div
			className="bottom-nav"
			initial={{ y: 100 }}
			animate={{ y: 0 }}
			transition={{ duration: 0.3 }}
		>
			<nav className="bottom-nav__container" role="navigation" aria-label="Mobile navigation">
				{items.map((item) => {
					const isActive =
						item?.route === "/" ? currentRoute === "/" : currentRoute.startsWith(item?.route || "");

					return (
						<button
							key={item.key}
							className={`bottom-nav__item ${isActive ? "active" : ""}`}
							onClick={() => handleNavClick(item.route)}
							aria-current={isActive ? "page" : undefined}
							aria-label={item.ariaLabel || item.label}
						>
							{item.icon && <item.icon className="bottom-nav__icon" aria-hidden={true} />}
							<span className="bottom-nav__label">{item.shortLabel || item.label}</span>
							{isActive && (
								<motion.div
									layoutId="bottomNavIndicator"
									className="bottom-nav__indicator"
									initial={false}
									transition={{ type: "spring", stiffness: 500, damping: 30 }}
								/>
							)}
						</button>
					);
				})}
			</nav>
		</motion.div>
	);
}
