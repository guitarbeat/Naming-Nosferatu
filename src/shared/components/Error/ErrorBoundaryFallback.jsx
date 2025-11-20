import React, { useMemo, useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { createStandardizedError } from "../../services/errorManager";
import {
  getMediaQueryList,
  attachMediaQueryListener,
} from "../../utils/mediaQueries";
import styles from "./Error.module.css";

const DEFAULT_MAX_RETRIES = 3;

/**
 * * Custom hook to detect reduced motion preference
 * @returns {boolean} Whether user prefers reduced motion
 */
function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    const mediaQuery = getMediaQueryList("(prefers-reduced-motion: reduce)");
    return mediaQuery ? mediaQuery.matches : false;
  });

  useEffect(() => {
    const mediaQuery = getMediaQueryList("(prefers-reduced-motion: reduce)");
    if (!mediaQuery) {
      return;
    }

    const cleanup = attachMediaQueryListener(mediaQuery, (e) => {
      setPrefersReducedMotion(e.matches);
    });

    return cleanup;
  }, []);

  return prefersReducedMotion;
}

/**
 * * Custom hook to detect screen size category
 * @returns {Object} Screen size information
 */
function useScreenSize() {
  const [screenSize, setScreenSize] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isSmallMobile: false,
  });

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      setScreenSize({
        isMobile: width <= 768,
        isTablet: width > 768 && width <= 1024,
        isDesktop: width > 1024,
        isSmallMobile: width <= 430,
      });
    };

    updateScreenSize();
    window.addEventListener("resize", updateScreenSize);
    window.addEventListener("orientationchange", updateScreenSize);

    return () => {
      window.removeEventListener("resize", updateScreenSize);
      window.removeEventListener("orientationchange", updateScreenSize);
    };
  }, []);

  return screenSize;
}

function ErrorBoundaryFallback({ error, resetErrorBoundary, onRetry }) {
  const [retryCount, setRetryCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const screenSize = useScreenSize();
  const mainContentRef = useRef(null);
  const retryButtonRef = useRef(null);

  // Fallback timestamp for when error doesn't have one
  const [fallbackTimestamp] = useState(() => Date.now());

  // * Focus management: Focus main content on mount for screen readers
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.focus();
    }
  }, []);

  // * Announce error to screen readers
  useEffect(() => {
    const announcement = document.createElement("div");
    announcement.setAttribute("role", "alert");
    announcement.setAttribute("aria-live", "assertive");
    announcement.setAttribute("aria-atomic", "true");
    announcement.className = "sr-only";
    announcement.textContent =
      "An error has occurred. Please review the error details below.";
    document.body.appendChild(announcement);

    return () => {
      document.body.removeChild(announcement);
    };
  }, []);

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
SCREEN SIZE: ${screenSize.isSmallMobile ? "Small Mobile" : screenSize.isMobile ? "Mobile" : screenSize.isTablet ? "Tablet" : "Desktop"}

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

      // * Announce to screen readers
      const announcement = document.createElement("div");
      announcement.setAttribute("role", "status");
      announcement.setAttribute("aria-live", "polite");
      announcement.className = "sr-only";
      announcement.textContent = "Diagnostic information copied to clipboard";
      document.body.appendChild(announcement);

      setTimeout(() => {
        setCopied(false);
        document.body.removeChild(announcement);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy diagnostics:", err);
      // * Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = diagnosticText;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error("Fallback copy also failed:", fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  // * Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isDetailsOpen) {
        setIsDetailsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDetailsOpen]);

  const boundaryContentClassName = [
    styles.boundaryContent,
    prefersReducedMotion ? styles.boundaryContentNoMotion : "",
    screenSize.isSmallMobile ? styles.boundaryContentSmallMobile : "",
    screenSize.isMobile ? styles.boundaryContentMobile : "",
    screenSize.isTablet ? styles.boundaryContentTablet : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={styles.boundary}
      role="alert"
      aria-labelledby="error-title"
      aria-describedby="error-message"
    >
      <div
        ref={mainContentRef}
        className={boundaryContentClassName}
        tabIndex={-1}
      >
        <div className={styles.boundaryIcon} aria-hidden="true">
          🐱
        </div>
        <h2 id="error-title" className={styles.boundaryTitle}>
          Oops! Something went wrong
        </h2>

        <p id="error-message" className={styles.boundaryMessage}>
          {errorMessage}
        </p>

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
          <p id="retry-info" className={styles.boundaryRetryInfo}>
            Attempt {retryCount + 1} of {DEFAULT_MAX_RETRIES}
          </p>
        )}

        <div
          className={styles.boundaryActions}
          role="group"
          aria-label="Error recovery actions"
        >
          <button
            ref={retryButtonRef}
            onClick={handleRetry}
            className={styles.boundaryRetryButton}
            aria-label={
              canRetry
                ? `Try again (Attempt ${retryCount + 1} of ${DEFAULT_MAX_RETRIES})`
                : "Reload page"
            }
            aria-describedby="retry-info"
          >
            <span className={styles.boundaryRetryIcon} aria-hidden="true">
              🐱
            </span>
            {canRetry ? "Try Again" : "Reload"}
          </button>

          <button
            onClick={() => window.location.reload()}
            className={styles.boundaryRefreshButton}
            aria-label="Refresh the page"
          >
            <span className={styles.boundaryRefreshIcon} aria-hidden="true">
              🔄
            </span>
            Refresh Page
          </button>

          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className={styles.boundaryHomeButton}
            aria-label="Return to home page"
          >
            <span className={styles.boundaryHomeIcon} aria-hidden="true">
              🏠
            </span>
            Back to Cat Names
          </button>

          {/* Copy Diagnostics Button */}
          <button
            onClick={handleCopyDiagnostics}
            className={styles.boundaryCopyButton}
            aria-label={
              copied
                ? "Diagnostics copied to clipboard"
                : "Copy diagnostic information to clipboard"
            }
            aria-pressed={copied}
          >
            <span className={styles.boundaryCopyIcon} aria-hidden="true">
              {copied ? "✅" : "📋"}
            </span>
            {copied ? "Copied!" : "Copy Diagnostics"}
          </button>
        </div>

        {process.env.NODE_ENV === "development" && error && (
          <details
            className={styles.boundaryDetails}
            open={isDetailsOpen}
            onToggle={(e) => setIsDetailsOpen(e.target.open)}
          >
            <summary>Error Details (Development)</summary>
            <div className={styles.boundaryErrorContent}>
              <h4>Error:</h4>
              <pre
                className={styles.boundaryErrorStack}
                role="log"
                aria-label="Error stack trace"
              >
                {error.toString()}
              </pre>

              {standardizedError && (
                <>
                  <h4>Error Analysis:</h4>
                  <ul className={styles.boundaryErrorList}>
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
          <p className={styles.boundarySupportText}>
            If this problem persists, please contact support with the following
            information:
          </p>
          <p
            className={styles.boundaryErrorId}
            aria-label={`Error ID: ${standardizedError?.timestamp || fallbackTimestamp}`}
          >
            {}
            Error ID: {standardizedError?.timestamp || fallbackTimestamp}
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
