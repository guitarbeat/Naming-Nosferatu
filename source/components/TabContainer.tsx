import { Card, CardBody, Tab, Tabs } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import { ReactNode, useEffect, useMemo, useState, useTransition } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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
	routeSync?: string;
	className?: string;
	headerClassName?: string;
	contentClassName?: string;
	title?: string | ((activeTab: string) => string);
	subtitle?: ReactNode;
	children?: ReactNode;
}

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
	const [activeTab, setActiveTab] = useState<string | undefined>();

	const initialActiveTab = useMemo(() => {
		if (routeSync) {
			const currentPath = location.pathname;
			const routeMatch = currentPath.startsWith(routeSync) ? currentPath : null;
			if (routeMatch) {
				const pathAfterBase = currentPath.replace(routeSync, "").replace(/^\//, "");
				const matchingTab = tabs.find((tab) => pathAfterBase === tab.key || pathAfterBase === "");
				if (matchingTab) {
					return matchingTab.key;
				}
			}
		}
		return defaultActiveTab || tabs[0]?.key || "";
	}, [routeSync, location.pathname, defaultActiveTab, tabs]);

	useEffect(() => {
		if (activeTab === undefined && initialActiveTab) {
			setActiveTab(initialActiveTab);
		}
	}, [activeTab, initialActiveTab]);

	useEffect(() => {
		if (!routeSync || activeTab === undefined) {
			return;
		}

		const currentPath = location.pathname;
		const pathAfterBase = currentPath.replace(routeSync, "").replace(/^\//, "");

		let newTabKey = tabs[0]?.key || "";
		if (pathAfterBase) {
			const matchingTab = tabs.find((tab) => pathAfterBase === tab.key);
			if (matchingTab) {
				newTabKey = matchingTab.key;
			}
		}

		if (newTabKey !== activeTab) {
			setActiveTab(newTabKey);
		}
	}, [location.pathname, routeSync, tabs, activeTab]);

	const handleTabChange = (key: React.Key) => {
		const tabKey = key as string;
		const tab = tabs.find((t) => t.key === tabKey);
		if (!tab || tab.disabled) {
			return;
		}

		startTransition(() => {
			setActiveTab(tabKey);

			if (routeSync) {
				const newPath = tabKey === tabs[0]?.key ? routeSync : `${routeSync}/${tabKey}`;
				navigate(newPath, { replace: true });
			}
		});
	};

	if (activeTab === undefined) {
		return null;
	}

	const resolvedTitle = typeof title === "function" ? title(activeTab) : title;

	return (
		<div className={`flex flex-col flex-1 w-full max-w-7xl mx-auto gap-6 ${className}`}>
			{(resolvedTitle || subtitle || tabs.length > 0) && (
				<Card
					className={`bg-white/5 border-1 border-white/10 backdrop-blur-xl shadow-2xl p-4 md:p-6 ${headerClassName}`}
				>
					<CardBody className="p-0 overflow-visible flex flex-col items-center">
						{resolvedTitle && (
							<h2 className="text-2xl md:text-3xl font-bold text-center mb-2 tracking-tight bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">
								{resolvedTitle}
							</h2>
						)}
						{subtitle && (
							<p className="text-default-500 text-center mb-6 max-w-2xl text-sm md:text-base leading-relaxed">
								{subtitle}
							</p>
						)}

						{children}

						{tabs.length > 1 && (
							<Tabs
								selectedKey={activeTab}
								onSelectionChange={handleTabChange}
								aria-label="Selection tabs"
								color="primary"
								variant="underlined"
								classNames={{
									base: "w-full flex justify-center",
									tabList: "gap-2 m-auto relative rounded-none p-0 border-b border-divider",
									cursor: "w-full bg-primary",
									tab: "max-w-fit px-4 h-12",
									tabContent:
										"group-data-[selected=true]:text-primary font-semibold text-sm uppercase tracking-wider",
								}}
							>
								{tabs.map((tab) => (
									<Tab
										key={tab.key}
										title={
											<div className="flex items-center gap-2">
												{tab.icon}
												<span>{tab.label}</span>
											</div>
										}
										disabled={tab.disabled || isPending}
									/>
								))}
							</Tabs>
						)}
					</CardBody>
				</Card>
			)}

			<div className={`flex-1 min-h-0 ${contentClassName}`}>
				<AnimatePresence mode="wait">
					<motion.div
						key={activeTab}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						transition={{ duration: 0.3, ease: "easeOut" }}
						className="h-full"
					>
						{tabs.find((t) => t.key === activeTab)?.content}
					</motion.div>
				</AnimatePresence>
			</div>
		</div>
	);
}

TabContainer.displayName = "TabContainer";
