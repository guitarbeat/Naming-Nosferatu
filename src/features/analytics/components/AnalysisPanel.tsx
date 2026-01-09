import type React from "react";
import { CollapsibleHeader } from "../../../shared/components/CollapsibleHeader";
import insightsStyles from "./AnalysisInsights.module.css";
import viewToggleStyles from "./ViewToggle.module.css";

interface AnalysisPanelProps {
	children: React.ReactNode;
	title?: string;
	actions?: React.ReactNode;
	showHeader?: boolean;
	toolbar?: React.ReactNode;
	className?: string;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
	children,
	title,
	actions,
	showHeader = true,
	toolbar,
	className = "",
}) => {
	return (
		<div className={`${insightsStyles.insightsPanel} ${className}`}>
			{showHeader && <CollapsibleHeader title={title || ""} actions={actions} variant="compact" />}
			{toolbar && <div className={viewToggleStyles.viewToggle}>{toolbar}</div>}
			{children}
		</div>
	);
};
