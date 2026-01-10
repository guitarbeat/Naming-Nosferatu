import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouting } from "../../../core/hooks/useRouting";
import { MAIN_NAV_ITEMS } from "../../navigation/config";
import styles from "./MobileMenu.module.css";

interface MobileMenuProps {
	isOpen: boolean;
	onClose: () => void;
	onLogout?: () => void;
}

export function MobileMenu({ isOpen, onClose, onLogout }: MobileMenuProps) {
	const { currentRoute, navigateTo } = useRouting();

	// Prevent scrolling when menu is open
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen]);

	const handleNavClick = (route?: string) => {
		if (route) {
			if (navigator.vibrate) navigator.vibrate(10);
			navigateTo(route);
			onClose();
		}
	};

	const isActive = (route?: string) => {
		if (!route) return false;
		if (route === "/") return currentRoute === "/";
		return currentRoute.startsWith(route);
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						className={styles.backdrop}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						aria-hidden="true"
					/>

					{/* Menu Panel */}
					<motion.div
						className={styles.menuPanel}
						initial={{ x: "100%" }}
						animate={{ x: 0 }}
						exit={{ x: "100%" }}
						transition={{ type: "spring", damping: 25, stiffness: 200 }}
						role="dialog"
						aria-modal="true"
						aria-label="Mobile Navigation"
					>
						<div className={styles.header}>
							<span className={styles.title}>Menu</span>
							<button className={styles.closeButton} onClick={onClose} aria-label="Close menu">
								<X size={24} />
							</button>
						</div>

						<nav className={styles.nav}>
							{MAIN_NAV_ITEMS.map((item) => (
								<MobileNavItem
									key={item.key}
									item={item}
									isActive={isActive}
									onNavClick={handleNavClick}
								/>
							))}
						</nav>

						{onLogout && (
							<div className={styles.footer}>
								<button
									className={styles.logoutButton}
									onClick={() => {
										if (navigator.vibrate) navigator.vibrate(10);
										onLogout();
										onClose();
									}}
								>
									Log Out
								</button>
							</div>
						)}
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}

function MobileNavItem({
	item,
	isActive,
	onNavClick,
}: {
	item: (typeof MAIN_NAV_ITEMS)[0];
	isActive: (route?: string) => boolean;
	onNavClick: (route?: string) => void;
}) {
	const [isExpanded, setIsExpanded] = useState(false);
	const hasChildren = item.children && item.children.length > 0;
	const isItemActive = isActive(item.route);

	// Auto-expand if child is active
	useEffect(() => {
		if (hasChildren && item.children?.some((child) => isActive(child.route))) {
			setIsExpanded(true);
		}
	}, [hasChildren, item.children]);

	const handleClick = () => {
		if (navigator.vibrate) navigator.vibrate(10);
		if (hasChildren) {
			setIsExpanded(!isExpanded);
		} else {
			onNavClick(item.route);
		}
	};

	return (
		<div className={styles.navItemContainer}>
			<button
				className={`${styles.navItem} ${isItemActive ? styles.active : ""}`}
				onClick={handleClick}
				aria-expanded={hasChildren ? isExpanded : undefined}
			>
				<div className={styles.itemContent}>
					{item.icon && <item.icon className={`${styles.icon} w-5 h-5`} />}
					<span className={styles.label}>{item.label}</span>
				</div>
				{hasChildren && (
					<ChevronDown
						className={`${styles.chevron} w-4 h-4`}
						style={{
							transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
						}}
					/>
				)}
			</button>

			<AnimatePresence>
				{hasChildren && isExpanded && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						className={styles.childrenContainer}
					>
						{item.children?.map((child) => (
							<button
								key={child.key}
								className={`${styles.childItem} ${isActive(child.route) ? styles.active : ""}`}
								onClick={() => onNavClick(child.route)}
							>
								{child.label}
							</button>
						))}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
