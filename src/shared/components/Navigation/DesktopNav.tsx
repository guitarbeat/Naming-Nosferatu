import { useMotionValueEvent, useScroll } from "framer-motion";
import { HelpCircle, LogOut } from "lucide-react";
import { useState } from "react";
import { useRouting } from "../../../core/hooks/useRouting";
import { MAIN_NAV_ITEMS } from "../../navigation/config";
import styles from "./DesktopNav.module.css";
import { KeyboardShortcutsOverlay } from "./KeyboardShortcutsOverlay";

interface DesktopNavProps {
	onLogout?: () => void;
	onOpenSuggestName?: () => void;
}

// biome-ignore lint/correctness/noUnusedVariables: onOpenSuggestName might be used in future or mobile view
export function DesktopNav({ onLogout, onOpenSuggestName: _ }: DesktopNavProps) {
	const { currentRoute, navigateTo } = useRouting();
	const [hidden, setHidden] = useState(false);
	const { scrollY } = useScroll();
	const [showShortcuts, setShowShortcuts] = useState(false);

	// Smart hide/show on scroll
	useMotionValueEvent(scrollY, "change", (latest) => {
		const previous = scrollY.getPrevious() || 0;
		if (latest > previous && latest > 150) {
			setHidden(true);
		} else {
			setHidden(false);
		}
	});

	// Global keyboard listener for shortcuts overlay
	useState(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Don't trigger if typing in an input
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement ||
				e.target instanceof HTMLSelectElement
			) {
				return;
			}

			if (e.key === "?") {
				e.preventDefault();
				setShowShortcuts((prev) => !prev);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	});

	const handleNavClick = (route?: string) => {
		if (route) {
			navigateTo(route);
		}
	};

	const isActive = (route?: string, exact = false) => {
		if (!route) {
			return false;
		}
		if (route === "/") {
			return currentRoute === "/";
		}
		return exact ? currentRoute === route : currentRoute.startsWith(route);
	};

	return (
		<>
			<header className={`${styles.desktopNav} ${hidden ? styles.hidden : ""}`}>
				<div className={styles.navContainer}>
					<div className={styles.leftSection}>
						{/* Logo */}
						<a
							href="/"
							className={styles.logo}
							onClick={(e) => {
								e.preventDefault();
								navigateTo("/");
							}}
						>
							Naming Nosferatu
						</a>

						{/* Primary Navigation */}
						<nav className={styles.navLinks} role="navigation">
							{MAIN_NAV_ITEMS.map((item) => (
								<div key={item.key} className={styles.navItem}>
									<button
										className={`${styles.navLink} ${isActive(item.route) ? styles.active : ""}`}
										onClick={() => handleNavClick(item.route)}
										aria-expanded={false}
									>
										{item.icon && <item.icon className={styles.icon} />}
										{item.label}
									</button>

									{/* Dropdown for children (Secondary Navigation) */}
									{item.children && item.children.length > 0 && (
										<div className={styles.dropdown}>
											{item.children.map((child) => (
												<button
													key={child.key}
													className={`${styles.dropdownItem} ${
														isActive(child.route, true) ? styles.active : ""
													}`}
													onClick={(e) => {
														e.stopPropagation();
														handleNavClick(child.route);
													}}
												>
													{child.label}
												</button>
											))}
										</div>
									)}
								</div>
							))}
						</nav>
					</div>

					{/* Right Section: Utilities */}
					<div className={styles.rightSection}>
						<button
							className={styles.utilityBtn}
							onClick={() => setShowShortcuts(true)}
							aria-label="Keyboard Shortcuts"
							title="Press '?' for keyboard shortcuts"
						>
							<HelpCircle size={20} />
						</button>

						{onLogout && (
							<button
								className={styles.utilityBtn}
								onClick={onLogout}
								aria-label="Log Out"
								title="Log Out"
							>
								<LogOut size={20} />
							</button>
						)}
					</div>
				</div>
			</header>

			{/* Spacing to prevent content from jumping when nav is fixed */}
			<div style={{ height: "64px", display: "none" }} className="desktop-spacer" />

			<KeyboardShortcutsOverlay isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
		</>
	);
}
