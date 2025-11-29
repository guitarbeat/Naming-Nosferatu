/**
 * @module AnalysisPanel/components/AnalysisToggle
 * @description Toggle button for Analysis Mode (sidebar)
 */

import PropTypes from "prop-types";
import { formatShortcut } from "../../../utils/platformUtils";

/**
 * Toggle button for Analysis Mode (sidebar)
 * @param {Object} props
 * @param {boolean} props.active - Whether Analysis Mode is active
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.collapsed - Whether sidebar is collapsed
 */
export function AnalysisToggle({ active, onClick, collapsed = false }) {
  const shortcutKey = formatShortcut("A", { ctrl: true, shift: true });

  return (
    <button
      type="button"
      className={`analysis-toggle ${active ? "analysis-toggle--active" : ""}`}
      onClick={onClick}
      aria-label={active ? "Exit Analysis Mode" : "Enter Analysis Mode"}
      aria-pressed={active}
      title={`${active ? "Exit" : "Enter"} Analysis Mode (${shortcutKey})`}
    >
      <span className="analysis-toggle-indicator" />
      {!collapsed && (
        <>
          <span className="analysis-toggle-label">
            {active ? "Analysis" : "Analyze"}
          </span>
          <span className="analysis-toggle-shortcut" aria-hidden="true">
            {shortcutKey}
          </span>
        </>
      )}
    </button>
  );
}

AnalysisToggle.propTypes = {
  active: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  collapsed: PropTypes.bool,
};

export default AnalysisToggle;

