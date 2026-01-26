import { cn } from "@utils";
import React from "react";
import { CollapsibleHeader } from "@/features/layout/CollapsibleHeader";

export const AnalysisPanel: React.FC<{
	children: React.ReactNode;
	title?: string;
	actions?: React.ReactNode;
	showHeader?: boolean;
	toolbar?: React.ReactNode;
	className?: string;
}> = ({ children, title, actions, showHeader = true, toolbar, className = "" }) => {
	return (
		<div className={cn("flex flex-col gap-4", className)}>
			{showHeader && <CollapsibleHeader title={title || ""} actions={actions} variant="compact" />}
			{toolbar && <div className="flex gap-2">{toolbar}</div>}
			{children}
		</div>
	);
};
