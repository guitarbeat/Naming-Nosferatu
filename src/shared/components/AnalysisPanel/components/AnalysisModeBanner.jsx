/**
 * @module AnalysisPanel/components/AnalysisModeBanner
 * @description Analysis Mode Banner - Visual indicator when Analysis Mode is active
 */

import PropTypes from "prop-types";
import { getModifierKey } from "../../../utils/platformUtils";
import { AnalysisBadge } from "./AnalysisBadge";
import { CloseIcon } from "./icons";

/**
 * Analysis Mode Banner - Visual indicator when Analysis Mode is active
 * @param {Object} props
 * @param {Function} props.onClose - Close handler (optional)
 * @param {boolean} props.showShortcut - Whether to show keyboard shortcut hint
 */
export function AnalysisModeBanner({ onClose, showShortcut = true }) {
  const shortcutDisplay = `${getModifierKey()} + Shift + A`;

  return (
    <div
      className="analysis-mode-banner"
      role="banner"
      aria-label="Analysis Mode Active"
    >
      <div className="analysis-mode-banner-content">
        <AnalysisBadge />
        <span className="analysis-mode-banner-text">Analysis Mode Active</span>
        {showShortcut && (
          <span className="analysis-mode-banner-shortcut">
            {shortcutDisplay}
          </span>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          className="analysis-mode-banner-close"
          onClick={onClose}
          aria-label="Dismiss Analysis Mode banner"
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );
}

AnalysisModeBanner.propTypes = {
  onClose: PropTypes.func,
  showShortcut: PropTypes.bool,
};

export default AnalysisModeBanner;
