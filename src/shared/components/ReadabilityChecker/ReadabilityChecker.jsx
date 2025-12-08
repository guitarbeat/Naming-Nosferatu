/**
 * @module ReadabilityChecker
 * @description React component for checking content readability in development.
 * Displays readability metrics and suggestions for improving text.
 * Only renders in development mode.
 */

import React, { useState, useMemo } from "react";
import PropTypes from "prop-types";
import {
  analyzeReadability,
  getReadabilitySummary,
  validateButtonText,
  validateHeadingText,
} from "../../utils/readabilityUtils";
import styles from "./ReadabilityChecker.module.css";

/**
 * ReadabilityChecker component for development use.
 * @param {Object} props - Component props
 * @param {string} props.text - Text to analyze
 * @param {string} props.type - Type of content ('button', 'heading', 'body', 'error')
 * @param {number} props.headingLevel - Heading level (1-6) if type is 'heading'
 * @param {boolean} props.showDetails - Whether to show detailed analysis
 * @returns {JSX.Element|null} Readability checker UI or null in production
 */
function ReadabilityChecker({
  text,
  type = "body",
  headingLevel = 2,
  showDetails = false,
}) {
  const isDevelopment = process.env.NODE_ENV === "development";
  const [isExpanded, setIsExpanded] = useState(showDetails);

  const analysis = useMemo(() => {
    if (!isDevelopment || !text || typeof text !== "string") {
      return null;
    }

    switch (type) {
      case "button":
        return validateButtonText(text);
      case "heading":
        return validateHeadingText(text, headingLevel);
      case "body":
      case "error":
      default:
        return analyzeReadability(text);
    }
  }, [headingLevel, isDevelopment, text, type]);

  if (!isDevelopment || !analysis || !text) {
    return null;
  }

  const isValid = analysis.isValid !== false;
  const hasIssues = analysis.issues && analysis.issues.length > 0;

  return (
    <div
      className={`${styles.checker} ${isValid ? styles.checkerValid : styles.checkerInvalid}`}
      role="region"
      aria-label="Readability checker"
    >
      <button
        type="button"
        className={styles.checkerToggle}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-label="Toggle readability details"
      >
        <span className={styles.checkerIcon}>{isValid ? "✅" : "⚠️"}</span>
        <span className={styles.checkerSummary}>
          {type === "button" || type === "heading"
            ? isValid
              ? "Text is clear"
              : "Text needs improvement"
            : getReadabilitySummary(analysis)}
        </span>
        <span className={styles.checkerToggleIcon}>
          {isExpanded ? "▲" : "▼"}
        </span>
      </button>

      {isExpanded && (
        <div className={styles.checkerDetails}>
          {hasIssues && (
            <div className={styles.checkerIssues}>
              <h4 className={styles.checkerIssuesTitle}>Issues Found:</h4>
              <ul className={styles.checkerIssuesList}>
                {analysis.issues.map((issue, index) => (
                  <li key={index} className={styles.checkerIssue}>
                    {typeof issue === "string" ? issue : issue.message}
                    {issue.suggestion && (
                      <span className={styles.checkerSuggestion}>
                        {" "}
                        → {issue.suggestion}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.suggestions && analysis.suggestions.length > 0 && (
            <div className={styles.checkerSuggestions}>
              <h4 className={styles.checkerSuggestionsTitle}>Suggestions:</h4>
              <ul className={styles.checkerSuggestionsList}>
                {analysis.suggestions.map((suggestion, index) => (
                  <li key={index} className={styles.checkerSuggestion}>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.metrics && (
            <div className={styles.checkerMetrics}>
              <h4 className={styles.checkerMetricsTitle}>Metrics:</h4>
              <dl className={styles.checkerMetricsList}>
                {analysis.metrics.wordCount !== undefined && (
                  <>
                    <dt>Word Count:</dt>
                    <dd>{analysis.metrics.wordCount}</dd>
                  </>
                )}
                {analysis.metrics.sentenceCount !== undefined && (
                  <>
                    <dt>Sentences:</dt>
                    <dd>{analysis.metrics.sentenceCount}</dd>
                  </>
                )}
                {analysis.metrics.avgWordsPerSentence !== undefined && (
                  <>
                    <dt>Avg Words/Sentence:</dt>
                    <dd>{analysis.metrics.avgWordsPerSentence.toFixed(1)}</dd>
                  </>
                )}
                {analysis.metrics.readingLevel !== undefined && (
                  <>
                    <dt>Reading Level:</dt>
                    <dd>Grade {analysis.metrics.readingLevel.toFixed(1)}</dd>
                  </>
                )}
                {analysis.metrics.hasPassiveVoice !== undefined && (
                  <>
                    <dt>Passive Voice:</dt>
                    <dd>{analysis.metrics.hasPassiveVoice ? "Yes" : "No"}</dd>
                  </>
                )}
              </dl>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

ReadabilityChecker.propTypes = {
  text: PropTypes.string,
  type: PropTypes.oneOf(["button", "heading", "body", "error"]),
  headingLevel: PropTypes.number,
  showDetails: PropTypes.bool,
};

export default ReadabilityChecker;
