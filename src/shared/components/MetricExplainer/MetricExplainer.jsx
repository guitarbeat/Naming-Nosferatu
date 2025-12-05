/**
 * @module MetricExplainer
 * @description Popover component for explaining metrics with definitions and examples
 */

import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  getMetricDefinition,
  getMetricLabel,
  getRatingRangeLabel,
} from '../../utils/metricDefinitions';
import './MetricExplainer.css';

/**
 * MetricExplainer Component
 * Shows detailed explanation of a metric in a popover
 *
 * @param {Object} props
 * @param {string} props.metricName - Name of the metric to explain
 * @param {number} props.value - Current value of the metric (for context)
 * @param {ReactNode} props.children - Trigger element (usually an icon button)
 * @param {string} props.placement - Popover placement: 'top', 'bottom', 'left', 'right'
 * @param {Function} props.onClose - Callback when popover closes
 * @returns {JSX.Element}
 */
export function MetricExplainer({
  metricName,
  value = null,
  children,
  placement = 'top',
  onClose,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  const definition = getMetricDefinition(metricName);

  // Close popover when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (
        popoverRef.current &&
        triggerRef.current &&
        !popoverRef.current.contains(event.target) &&
        !triggerRef.current.contains(event.target)
      ) {
        handleClose();
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  if (!definition) {
    return children;
  }

  const label = getMetricLabel(metricName);
  const valueLabel = value !== null && metricName === 'rating' ? getRatingRangeLabel(value) : null;

  return (
    <div className="metric-explainer">
      <div
        ref={triggerRef}
        className="metric-explainer-trigger"
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
        role="button"
        tabIndex="0"
        aria-expanded={isOpen}
        aria-label={`Show explanation for ${label}`}
        title={`Click to learn about ${label}`}
      >
        {children}
      </div>

      {isOpen && (
        <div
          ref={popoverRef}
          className={`metric-explainer-popover metric-explainer-popover-${placement}`}
          role="tooltip"
          aria-hidden="false"
        >
          <div className="metric-explainer-content">
            {/* Header */}
            <div className="metric-explainer-header">
              <h3 className="metric-explainer-title">{label}</h3>
              {valueLabel && (
                <span className="metric-explainer-value-label">{valueLabel}</span>
              )}
            </div>

            {/* Description */}
            <p className="metric-explainer-description">
              {definition.fullDescription || definition.description}
            </p>

            {/* Current Value Context */}
            {value !== null && (
              <div className="metric-explainer-context">
                <strong>Your value:</strong> {value}
                {valueLabel && <span className="metric-explainer-level"> ({valueLabel})</span>}
              </div>
            )}

            {/* Examples */}
            {definition.examples && definition.examples.length > 0 && (
              <div className="metric-explainer-examples">
                <strong className="metric-explainer-examples-title">Examples:</strong>
                <ul className="metric-explainer-examples-list">
                  {definition.examples.map((example, index) => (
                    <li key={index} className="metric-explainer-example-item">
                      <span className="example-value">{example.value}</span>
                      <span className="example-text">{example.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Help Text */}
            {definition.helpText && (
              <p className="metric-explainer-help">{definition.helpText}</p>
            )}

            {/* Range Info */}
            {definition.range && (
              <p className="metric-explainer-range">
                <strong>Range:</strong> {definition.range}
              </p>
            )}

            {/* Close Button */}
            <button
              className="metric-explainer-close"
              onClick={handleClose}
              aria-label="Close explanation"
              type="button"
            >
              ✕
            </button>
          </div>

          {/* Arrow pointing to trigger */}
          <div className="metric-explainer-arrow" />
        </div>
      )}
    </div>
  );
}

MetricExplainer.propTypes = {
  metricName: PropTypes.string.isRequired,
  value: PropTypes.number,
  children: PropTypes.node.isRequired,
  placement: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
  onClose: PropTypes.func,
};

MetricExplainer.displayName = 'MetricExplainer';

/**
 * InfoIcon Component - Commonly used trigger for MetricExplainer
 */
export function InfoIcon() {
  return (
    <span
      className="info-icon"
      aria-hidden="true"
      title="Click for more information"
    >
      ⓘ
    </span>
  );
}

export default MetricExplainer;
