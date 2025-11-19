import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { createStandardizedError } from "../../services/errorManager";
import styles from "./Error.module.css";

const DEFAULT_MAX_RETRIES = 3;

function ErrorBoundaryFallback({ error, resetErrorBoundary, onRetry }) {
  const [retryCount, setRetryCount] = useState(0);
  const [copied, setCopied] = useState(false);

  const standardizedError = useMemo(
    () =>
      createStandardizedError(
        error,
        "React Component Error",
        {
          isRetryable: true,
          affectsUserData: false,
          isCritical: false,
        },
        // eslint-disable-next-line react-hooks/purity
        Date.now(),
      ),
    [error],
  );

  const canRetry = retryCount < DEFAULT_MAX_RETRIES;
  const errorMessage =
    standardizedError?.userMessage ||
    "Oops! Something went wrong while helping you find the purr-fect cat name. Don't worry, our cats are still here to help!";

  const handleRetry = () => {
    if (!canRetry) {
      window.location.reload();
      return;
    }

    setRetryCount((count) => count + 1);
    if (typeof onRetry === "function") {
      onRetry();
    }
    resetErrorBoundary();
  };

  const diagnosticInfo = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    errorType: standardizedError?.errorType || "Unknown",
    errorMessage: error?.message || error?.toString() || "Unknown error",
    errorStack: error?.stack || "No stack trace available",
    retryCount,
    hasNetwork: navigator.onLine ? "Online" : "Offline",
    backendHealth: "Not checked",
    additionalInfo: standardizedError?.additionalInfo || {},
  };

  const handleCopyDiagnostics = async () => {
    const diagnosticText = `Cat Name Tournament - Error Diagnostics
═══════════════════════════════════════════

TIMESTAMP: ${diagnosticInfo.timestamp}
ERROR TYPE: ${diagnosticInfo.errorType}
RETRY COUNT: ${diagnosticInfo.retryCount}
NETWORK STATUS: ${diagnosticInfo.hasNetwork}

ERROR MESSAGE:
${diagnosticInfo.errorMessage}

ERROR STACK:
${diagnosticInfo.errorStack}

USER AGENT:
${diagnosticInfo.userAgent}

URL:
${diagnosticInfo.url}

${
  diagnosticInfo.errorType === "NetworkError" ||
  diagnosticInfo.errorType === "BackendError"
    ? `
⚠️  BACKEND DIAGNOSTICS
═══════════════════════════════════════════
This appears to be a backend connectivity issue.

Possible causes:
• Supabase backend is unreachable
• Network connectivity problems
• Database service is down
• RPC function errors

Please check:
1. Internet connection
2. Supabase project status
3. Browser console for network errors
4. Backend API health

If this persists, the backend infrastructure may need attention.
`
    : ""
}

ADDITIONAL INFO:
${JSON.stringify(diagnosticInfo.additionalInfo, null, 2)}

═══════════════════════════════════════════`;

    try {
      await navigator.clipboard.writeText(diagnosticText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy diagnostics:", err);
    }
  };

  return (
    <div className={styles.boundary}>
      <div className={styles.boundaryContent}>
        <div className={styles.boundaryIcon}>🐱</div>
        <h2 className={styles.boundaryTitle}>Oops! Something went wrong</h2>

        <p className={styles.boundaryMessage}>{errorMessage}</p>

        {/* Error Type Badge */}
        {(diagnosticInfo.errorType === "NetworkError" ||
          diagnosticInfo.errorType === "BackendError") && (
          <div className={styles.boundaryBackendWarning}>
            <span className={styles.boundaryWarningIcon}>⚠️</span>
            <div>
              <strong>Backend Connection Issue</strong>
              <p>
                This appears to be a connectivity problem with our backend
                services.
              </p>
            </div>
          </div>
        )}

        <div className={styles.boundarySuggestions}>
          <h3 className={styles.boundarySuggestionsTitle}>
            Here&apos;s what you can try:
          </h3>
          <ul className={styles.boundarySuggestionsList}>
            <li>🔄 Refresh the page to start fresh</li>
            <li>🏠 Go back to the main page and try again</li>
            <li>📱 Check your internet connection</li>
            <li>🐱 Our cats are still working hard to help you!</li>
          </ul>
        </div>

        {canRetry && (
          <p className={styles.boundaryRetryInfo}>
            Attempt {retryCount + 1} of {DEFAULT_MAX_RETRIES}
          </p>
        )}

        <div className={styles.boundaryActions}>
          <button onClick={handleRetry} className={styles.boundaryRetryButton}>
            <span className={styles.boundaryRetryIcon}>🐱</span>
            {canRetry ? "Try Again" : "Reload"}
          </button>

          <button
            onClick={() => window.location.reload()}
            className={styles.boundaryRefreshButton}
          >
            <span className={styles.boundaryRefreshIcon}>🔄</span>
            Refresh Page
          </button>

          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className={styles.boundaryHomeButton}
          >
            <span className={styles.boundaryHomeIcon}>🏠</span>
            Back to Cat Names
          </button>

          {/* Copy Diagnostics Button */}
          <button
            onClick={handleCopyDiagnostics}
            className={styles.boundaryCopyButton}
          >
            <span className={styles.boundaryCopyIcon}>
              {copied ? "✅" : "📋"}
            </span>
            {copied ? "Copied!" : "Copy Diagnostics"}
          </button>
        </div>

        {process.env.NODE_ENV === "development" && error && (
          <details className={styles.boundaryDetails}>
            <summary>Error Details (Development)</summary>
            <div className={styles.boundaryErrorContent}>
              <h4>Error:</h4>
              <pre>{error.toString()}</pre>

              {standardizedError && (
                <>
                  <h4>Error Analysis:</h4>
                  <ul>
                    <li>
                      <strong>Type:</strong> {standardizedError.errorType}
                    </li>
                    <li>
                      <strong>Severity:</strong> {standardizedError.severity}
                    </li>
                    <li>
                      <strong>Context:</strong> {standardizedError.context}
                    </li>
                    <li>
                      <strong>Retryable:</strong>{" "}
                      {standardizedError.isRetryable ? "Yes" : "No"}
                    </li>
                    <li>
                      <strong>Timestamp:</strong> {standardizedError.timestamp}
                    </li>
                  </ul>
                </>
              )}
            </div>
          </details>
        )}

        <div className={styles.boundarySupport}>
          <p>
            If this problem persists, please contact support with the following
            information:
          </p>
          <p className={styles.boundaryErrorId}>
            {/* eslint-disable-next-line react-hooks/purity */}
            Error ID: {standardizedError?.timestamp || Date.now()}
          </p>
        </div>
      </div>
    </div>
  );
}

ErrorBoundaryFallback.propTypes = {
  error: PropTypes.any.isRequired,
  resetErrorBoundary: PropTypes.func.isRequired,
  onRetry: PropTypes.func,
};

export default ErrorBoundaryFallback;
