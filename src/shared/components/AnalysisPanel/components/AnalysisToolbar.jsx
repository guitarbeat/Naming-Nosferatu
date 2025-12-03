/**
 * @module AnalysisPanel/components/AnalysisToolbar
 * @description Toolbar for Analysis Mode actions
 */

import PropTypes from "prop-types";

/**
 * Toolbar for Analysis Mode actions
 * @param {Object} props
 * @param {React.ReactNode} props.children - Toolbar content
 * @param {number} props.selectedCount - Number of selected items
 * @param {React.ReactNode} props.actions - Action buttons
 */
export function AnalysisToolbar({ children, selectedCount = 0, actions }) {
  return (
    <div className="analysis-toolbar">
      {selectedCount > 0 && (
        <>
          <div className="analysis-selection">
            <span className="analysis-selection-count">{selectedCount}</span>
            <span className="analysis-selection-label">selected</span>
          </div>
          <div className="analysis-toolbar-divider" />
        </>
      )}
      {children}
      {actions && (
        <>
          <div style={{ flex: 1 }} />
          <div className="analysis-toolbar-group">{actions}</div>
        </>
      )}
    </div>
  );
}

AnalysisToolbar.propTypes = {
  children: PropTypes.node,
  selectedCount: PropTypes.number,
  actions: PropTypes.node,
};

export default AnalysisToolbar;
