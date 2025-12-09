import React, { useMemo, useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { createStandardizedError } from "../../services/errorManager";
import {
  getMediaQueryList,
  attachMediaQueryListener,
} from "../../utils/mediaQueries";
import LiquidGlass from "../LiquidGlass";
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
    announcement.className = "sr-only";
    announcement.textContent = "An error has occurred.";
    document.body.appendChild(announcement);
    return () => document.body.removeChild(announcement);
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
        Date.now()
      ),
    [error]
  );

  const canRetry = retryCount < DEFAULT_MAX_RETRIES;

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

  // * Use diagnostics from standardized error if available
  const diagnostics = standardizedError?.diagnostics || {};
  const stackFrames = diagnostics?.stackFrames || [];
  const debugHints = diagnostics?.debugHints || [];

  const diagnosticInfo = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    errorType:
      standardizedError?.type || standardizedError?.errorType || "Unknown",
    errorMessage: error?.message || error?.toString() || "Unknown error",
    errorStack: error?.stack || "No stack trace available",
    retryCount,
    hasNetwork: navigator.onLine ? "Online" : "Offline",
    backendHealth: "Not checked",
    additionalInfo: standardizedError?.additionalInfo || {},
    severity: standardizedError?.severity || "Unknown",
    context: standardizedError?.context || "React Component Error",
    isRetryable: standardizedError?.isRetryable ?? false,
    diagnostics,
    stackFrames,
    debugHints,
  };

  const handleCopyDiagnostics = async () => {
    // * Use parsed stack frames from diagnostics if available, otherwise parse manually
    const parsedFrames =
      diagnosticInfo.stackFrames.length > 0
        ? diagnosticInfo.stackFrames.slice(0, 5).map((frame) => ({
            file: frame.file?.split("/").pop() || frame.file || "unknown",
            fullPath: frame.file || "unknown",
            line: frame.line || "?",
            col: frame.column || "?",
            function: frame.functionName || "anonymous",
          }))
        : diagnosticInfo.errorStack
            .split("\n")
            .filter(
              (line) => line.includes("http://") || line.includes("file://")
            )
            .map((line) => {
              const match = line.match(/([^:]+):(\d+):(\d+)/);
              if (match) {
                const [, file, lineNum, colNum] = match;
                const fileName = file.split("/").pop() || file;
                const funcMatch = line.match(/at\s+(\w+)\s*\(/);
                return {
                  file: fileName,
                  fullPath: file,
                  line: lineNum,
                  col: colNum,
                  function: funcMatch ? funcMatch[1] : "anonymous",
                };
              }
              return null;
            })
            .filter(Boolean)
            .slice(0, 5);

    // * Extract component/function names from stack
    const componentMatches =
      diagnosticInfo.errorStack.match(/at\s+(\w+)\s*\(/g);
    const components = componentMatches
      ? componentMatches.map((m) => m.replace(/at\s+(\w+)\s*\(/, "$1"))
      : [];

    // * Determine likely fix category based on error type and message
    const errorMsg = diagnosticInfo.errorMessage.toLowerCase();
    const errorType = diagnosticInfo.errorType?.toLowerCase() || "";
    let fixCategory = "RUNTIME_ERROR";
    let suggestedFixes = [];

    if (
      errorType.includes("network") ||
      errorType.includes("backend") ||
      errorMsg.includes("fetch") ||
      errorMsg.includes("network")
    ) {
      fixCategory = "NETWORK/BACKEND";
      suggestedFixes = [
        "Check network connectivity and browser console for CORS/network errors",
        "Verify Supabase backend is accessible and API endpoints are correct",
        "Check if backend service is running and environment variables are set",
        "Review network request payload and headers",
      ];
    } else if (
      errorMsg.includes("is not defined") ||
      errorMsg.includes("cannot find")
    ) {
      fixCategory = "REFERENCE_ERROR";
      suggestedFixes = [
        "Check if variable/function is imported correctly",
        "Verify the variable exists in the component scope",
        "Check for typos in variable names",
        "Ensure props are passed correctly to child components",
        "Verify all dependencies are installed",
      ];
    } else if (
      errorMsg.includes("must be used") ||
      errorMsg.includes("context") ||
      errorMsg.includes("provider")
    ) {
      fixCategory = "CONTEXT_HOOK_ERROR";
      suggestedFixes = [
        "Verify component is wrapped in the required Context Provider",
        "Check if hook is called outside component render",
        "Ensure Context Provider is rendered before component using hook",
        "Verify prop names match between Provider and consumer",
        "Check component hierarchy - hook must be descendant of Provider",
      ];
    } else if (
      errorMsg.includes("cannot read") ||
      errorMsg.includes("null") ||
      errorMsg.includes("undefined")
    ) {
      fixCategory = "NULL_REFERENCE";
      suggestedFixes = [
        "Add null/undefined checks before accessing properties",
        "Use optional chaining (?.) where appropriate",
        "Provide default values for potentially undefined variables",
        "Check if data is loaded before accessing",
        "Verify API responses contain expected data structure",
      ];
    } else {
      suggestedFixes = [
        "Review the stack trace for the exact error location",
        "Check component props and state management",
        "Verify all dependencies are installed and versions match",
        "Check for recent code changes that might have introduced the error",
        "Review browser console for additional error details",
      ];
    }

    const diagnosticText = `# Error Diagnostics for LLM Agent

## Error Summary
- **Type**: ${diagnosticInfo.errorType}
- **Severity**: ${diagnosticInfo.severity}
- **Category**: ${fixCategory}
- **Context**: ${diagnosticInfo.context}
- **Retryable**: ${diagnosticInfo.isRetryable ? "Yes" : "No"}
- **Timestamp**: ${diagnosticInfo.timestamp}
- **Retry Count**: ${diagnosticInfo.retryCount}/${DEFAULT_MAX_RETRIES}
- **Network**: ${diagnosticInfo.hasNetwork}
- **Screen Size**: ${screenSize.isSmallMobile ? "Small Mobile" : screenSize.isMobile ? "Mobile" : screenSize.isTablet ? "Tablet" : "Desktop"}

## Error Message
\`\`\`
${diagnosticInfo.errorMessage}
\`\`\`

## Stack Trace
\`\`\`
${diagnosticInfo.errorStack}
\`\`\`

## Code Locations (Top ${parsedFrames.length} frames)
${
  parsedFrames.length > 0
    ? parsedFrames
        .map(
          (frame, idx) =>
            `${idx + 1}. **${frame.function}** in \`${frame.file}\` (Line ${frame.line}, Col ${frame.col})\n   Full path: \`${frame.fullPath}\``
        )
        .join("\n")
    : "Unable to parse stack frames"
}

## Affected Components/Functions
${
  components.length > 0
    ? components.map((c) => `- \`${c}\``).join("\n")
    : parsedFrames.length > 0
      ? parsedFrames
          .map((f) => `- \`${f.function}\` (${f.file}:${f.line})`)
          .join("\n")
      : "- Unable to extract"
}

## Debug Hints
${
  diagnosticInfo.debugHints.length > 0
    ? diagnosticInfo.debugHints
        .map((hint) => `- **${hint.title}**: ${hint.detail}`)
        .join("\n")
    : "No specific debug hints available"
}

## Suggested Fixes
${suggestedFixes.map((fix, idx) => `${idx + 1}. ${fix}`).join("\n")}

## Environment
- **URL**: ${diagnosticInfo.url}
- **Browser**: ${navigator.userAgent.includes("Chrome") ? "Chrome" : navigator.userAgent.includes("Firefox") ? "Firefox" : navigator.userAgent.includes("Safari") ? "Safari" : "Unknown"}
- **User Agent**: ${diagnosticInfo.userAgent}

## Structured Error Data
\`\`\`json
${JSON.stringify(
  {
    errorType: diagnosticInfo.errorType,
    severity: diagnosticInfo.severity,
    context: diagnosticInfo.context,
    isRetryable: diagnosticInfo.isRetryable,
    message: diagnosticInfo.errorMessage,
    stackFrames: parsedFrames,
    components,
    fixCategory,
    ...diagnosticInfo.additionalInfo,
  },
  null,
  2
)}
\`\`\`

## Next Steps for LLM Agent
1. **Locate the error**: Check files mentioned in Code Locations above
2. **Identify root cause**: Review the error message and stack trace
3. **Apply fix**: Follow the Suggested Fixes based on the category
4. **Verify**: Test the fix and ensure no regressions
5. **Document**: If fix is non-trivial, add comments explaining the solution

---
*Generated for LLM agent analysis - ${new Date().toISOString()}*`;

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
      <LiquidGlass
        width={600}
        height={400}
        radius={24}
        scale={-180}
        saturation={1.2}
        frost={0.08}
        inputBlur={12}
        outputBlur={0.8}
        className={styles.boundaryGlass}
        id="error-boundary-glass-filter"
        style={{ width: "100%", maxWidth: "600px", height: "auto" }}
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
            Something went wrong
          </h2>

          {(diagnosticInfo.errorType === "NetworkError" ||
            diagnosticInfo.errorType === "BackendError") && (
            <div className={styles.boundaryBackendWarning}>
              <span className={styles.boundaryWarningIcon}>⚠️</span>
              <span>Connection issue detected</span>
            </div>
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
              aria-label={canRetry ? "Try again" : "Reload page"}
            >
              {canRetry ? "Try Again" : "Reload"}
            </button>

            <button
              onClick={() => {
                window.location.href = "/";
              }}
              className={styles.boundaryHomeButton}
              aria-label="Return to home page"
            >
              Home
            </button>

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
                        <strong>Timestamp:</strong>{" "}
                        {standardizedError.timestamp}
                      </li>
                    </ul>
                  </>
                )}
              </div>
            </details>
          )}
        </div>
      </LiquidGlass>
    </div>
  );
}

ErrorBoundaryFallback.propTypes = {
  error: PropTypes.instanceOf(Error).isRequired,
  resetErrorBoundary: PropTypes.func.isRequired,
  onRetry: PropTypes.func,
};

export default ErrorBoundaryFallback;
