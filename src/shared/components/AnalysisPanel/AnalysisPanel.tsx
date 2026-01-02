/**
 * @module AnalysisPanel
 * @description Unified container component for Analysis Mode.
 * Provides a cohesive visual wrapper with consistent styling and layout.
 * Can integrate TournamentToolbar for a unified interface.
 */

import PropTypes from "prop-types";
import "../../styles/analysis-mode.css";
import { AnalysisHeader } from "./components/AnalysisComponents";

/**
 * Primary Analysis Panel container
 * @param {Object} props
 * @param {React.ReactNode} props.children - Panel content
 * @param {string} props.title - Optional panel title
 * @param {React.ReactNode} props.actions - Optional header action buttons
 * @param {boolean} props.showHeader - Whether to show the header
 * @param {React.ReactNode} props.toolbar - Optional toolbar component (e.g., TournamentToolbar)
 * @param {string} props.className - Additional CSS classes
 */
interface AnalysisPanelProps {
	children: React.ReactNode;
	title?: string;
	actions?: React.ReactNode;
	showHeader?: boolean;
	toolbar?: React.ReactNode;
	className?: string;
}

export function AnalysisPanel({
	children,
	title,
	actions,
	showHeader = true,
	toolbar,
	className = "",
}: AnalysisPanelProps) {
	return (
		<div className={`analysis-panel ${className}`}>
			{showHeader && (
				<AnalysisHeader
					title={title}
					actions={actions}
					showBadge={false}
					collapsible={false}
				/>
			)}
			{toolbar && <div className="analysis-panel-toolbar">{toolbar}</div>}
			{children}
		</div>
	);
}

AnalysisPanel.propTypes = {
	children: PropTypes.node.isRequired,
	title: PropTypes.string,
	actions: PropTypes.node,
	showHeader: PropTypes.bool,
	toolbar: PropTypes.node,
	className: PropTypes.string,
};
