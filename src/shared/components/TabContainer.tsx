import { ReactNode, useEffect, useMemo, useState, useTransition } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./TabContainer.module.css";

export interface TabItem {
	key: string;
	label: string;
	icon?: ReactNode;
	content: ReactNode;
	disabled?: boolean;
}

export interface TabContainerProps {
	tabs: TabItem[];
	defaultActiveTab?: string;
	routeSync?: string; // Base route for URL sync, e.g. "/explore"
	className?: string;
	headerClassName?: string;
	contentClassName?: string;
	title?: string | ((activeTab: string) => string);
	subtitle?: ReactNode;
	children?: ReactNode; // Additional content to render before tabs
}

/**
 * Unified TabContainer component that consolidates tab logic from Explore and Dashboard
 * Handles state management, URL synchronization, and smooth transitions
 */
export function TabContainer({
	tabs,
	defaultActiveTab,
	routeSync,
	className = "",
	headerClassName = "",
	contentClassName = "",
	title,
	subtitle,
	children,
}: TabContainerProps) {
	const navigate = useNavigate();
	const location = useLocation();
	const [isPending, startTransition] = useTransition();

	// Initialize active tab from props or URL (moved to avoid Router context issues)
	const [activeTab, setActiveTab] = useState<string | undefined>();

	// Initialize active tab after Router context is ready
	const initialActiveTab = useMemo(() => {
		if (routeSync) {
			// Extract tab from URL
			const currentPath = location.pathname;
			const routeMatch = currentPath.startsWith(routeSync) ? currentPath : null;
			if (routeMatch) {
				const pathAfterBase = currentPath.replace(routeSync, "").replace(/^\//, "");
				const matchingTab = tabs.find(tab => pathAfterBase === tab.key || pathAfterBase === "");
				if (matchingTab) {
					return matchingTab.key;
				}
			}
		}
		return defaultActiveTab || tabs[0]?.key || "";
	}, [routeSync, location.pathname, defaultActiveTab, tabs]);

	// Set initial active tab once Router context is ready
	useEffect(() => {
		if (activeTab === undefined && initialActiveTab) {
			setActiveTab(initialActiveTab);
		}
	}, [activeTab, initialActiveTab]);

	// Sync tab with URL changes
	useEffect(() => {
		if (!routeSync || activeTab === undefined) return;

		const currentPath = location.pathname;
		const pathAfterBase = currentPath.replace(routeSync, "").replace(/^\//, "");

		let newTabKey = tabs[0]?.key || "";
		if (pathAfterBase) {
			const matchingTab = tabs.find(tab => pathAfterBase === tab.key);
			if (matchingTab) {
				newTabKey = matchingTab.key;
			}
		}

		if (newTabKey !== activeTab) {
			setActiveTab(newTabKey);
		}
	}, [location.pathname, routeSync, tabs, activeTab]);

	const handleTabChange = (tabKey: string) => {
		const tab = tabs.find(t => t.key === tabKey);
		if (!tab || tab.disabled) return;

		startTransition(() => {
			setActiveTab(tabKey);

			// Update URL if routeSync is provided
			if (routeSync) {
				const newPath = tabKey === tabs[0]?.key ? routeSync : `${routeSync}/${tabKey}`;
				navigate(newPath, { replace: true });
			}
		});
	};

	// Don't render until activeTab is initialized to prevent Router context issues
	if (activeTab === undefined) {
		return null;
	}

	const activeTabData = tabs.find(tab => tab.key === activeTab);

	const resolvedTitle = typeof title === "function" ? title(activeTab) : title;

	return (
		<div className={`${styles.container} ${className}`}>
			{(resolvedTitle || subtitle || tabs.length > 0) && (
				<div className={`${styles.header} ${headerClassName}`}>
					{resolvedTitle && <h2 className={styles.title}>{resolvedTitle}</h2>}
					{subtitle && <p className={styles.subtitle}>{subtitle}</p>}

					{children}

					{tabs.length > 1 && (
						<div className={styles.tabs}>
							{tabs.map(tab => (
								<button
									key={tab.key}
									type="button"
									className={`${styles.tabBtn} ${activeTab === tab.key ? styles.active : ""} ${tab.disabled ? styles.disabled : ""}`}
									onClick={() => handleTabChange(tab.key)}
									disabled={tab.disabled || isPending}
									aria-pressed={activeTab === tab.key}
								>
									{tab.icon}
									<span>{tab.label}</span>
								</button>
							))}
						</div>
					)}
				</div>
			)}

			<div className={`${styles.content} ${contentClassName}`}>
				{activeTabData?.content}
			</div>
		</div>
	);
}

TabContainer.displayName = "TabContainer";