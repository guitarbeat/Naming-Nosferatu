/**
 * @module DeploymentErrorDetector
 * @description Detects and displays informative errors for common deployment issues,
 * such as script loading failures, CSP violations, missing environment variables, etc.
 */

import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import styles from "./DeploymentErrorDetector.module.css";

/**
 * * Detects common deployment issues and displays helpful error messages
 * @param {Object} props - Component props
 * @param {Function} props.onErrorDetected - Callback when an error is detected
 * @returns {JSX.Element|null} Error display component or null if no errors
 */
function DeploymentErrorDetector({ onErrorDetected }) {
  const [deploymentError, setDeploymentError] = useState(null);
  const [cspViolations, setCspViolations] = useState([]);

  useEffect(() => {
    // * Check for script loading failures
    const checkScriptLoading = () => {
      const scripts = document.querySelectorAll('script[type="module"]');
      let failedScripts = [];

      scripts.forEach((script) => {
        script.addEventListener("error", (event) => {
          const src = script.src || script.getAttribute("src");
          failedScripts.push({
            src,
            error: "Script failed to load",
            type: "SCRIPT_LOAD_ERROR",
          });
        });
      });

      // * Check if main entry script exists and loaded
      const mainScript = document.querySelector('script[src*="index"]');
      if (mainScript) {
        mainScript.addEventListener("error", () => {
          setDeploymentError({
            type: "SCRIPT_LOAD_ERROR",
            title: "JavaScript Failed to Load",
            message:
              "The application's JavaScript files could not be loaded. This is often caused by:",
            details: [
              "Content Security Policy (CSP) blocking scripts",
              "Incorrect build output paths",
              "Missing or incorrect base path configuration",
              "Network issues preventing script downloads",
            ],
            suggestions: [
              "Check browser console for CSP violations (look for 'Content-Security-Policy' errors)",
              "Verify that script files exist in the /assets/js/ directory",
              "Check Network tab to see if scripts return 404 or are blocked",
              "Review vercel.json CSP configuration",
              "Ensure Vite build completed successfully",
            ],
            severity: "critical",
          });
          if (onErrorDetected) {
            onErrorDetected("SCRIPT_LOAD_ERROR");
          }
        });
      }

      // * Check if React root element exists but app didn't mount
      setTimeout(() => {
        const root = document.getElementById("root");
        if (root && root.children.length === 0) {
          // * Check if scripts loaded but app didn't initialize
          const hasLoadedScripts = Array.from(document.scripts).some(
            (s) => s.src && s.src.includes("assets"),
          );

          if (!hasLoadedScripts) {
            setDeploymentError({
              type: "APP_INIT_ERROR",
              title: "Application Failed to Initialize",
              message:
                "The application's JavaScript loaded but failed to initialize. Possible causes:",
              details: [
                "JavaScript errors preventing React from mounting",
                "Missing environment variables (VITE_SUPABASE_URL, etc.)",
                "Build configuration issues",
                "Runtime errors in the application code",
              ],
              suggestions: [
                "Open browser console (F12) and check for JavaScript errors",
                "Verify all required environment variables are set in Vercel",
                "Check that the build completed without errors",
                "Review the error boundary fallback for more details",
                "Try rebuilding the application",
              ],
              severity: "critical",
            });
            if (onErrorDetected) {
              onErrorDetected("APP_INIT_ERROR");
            }
          }
        }
      }, 3000); // * Wait 3 seconds for app to mount
    };

    // * Monitor CSP violations
    const checkCSPViolations = () => {
      // * Listen for security policy violations
      document.addEventListener("securitypolicyviolation", (event) => {
        const violation = {
          type: "CSP_VIOLATION",
          blockedURI: event.blockedURI,
          violatedDirective: event.violatedDirective,
          effectiveDirective: event.effectiveDirective,
          originalPolicy: event.originalPolicy,
        };

        setCspViolations((prev) => [...prev, violation]);

        // * If script-src is violated, show deployment error
        if (
          event.violatedDirective === "script-src" ||
          event.effectiveDirective === "script-src"
        ) {
          setDeploymentError({
            type: "CSP_VIOLATION",
            title: "Content Security Policy Violation",
            message:
              "The application's scripts are being blocked by Content Security Policy:",
            details: [
              `Blocked resource: ${event.blockedURI || "Unknown"}`,
              `Violated directive: ${event.violatedDirective}`,
              `Current CSP: ${event.originalPolicy}`,
            ],
            suggestions: [
              "Update vercel.json CSP to allow scripts from 'self'",
              "Add 'blob:' to script-src for Vite's dynamic imports",
              "Ensure 'unsafe-inline' is included if needed",
              "Check that script sources match CSP rules",
              "Review Vercel deployment logs for CSP configuration",
            ],
            severity: "critical",
            cspViolation: violation,
          });
          if (onErrorDetected) {
            onErrorDetected("CSP_VIOLATION");
          }
        }
      });
    };

    // * Check for missing environment variables
    const checkEnvironmentVariables = () => {
      // * Check for Supabase configuration
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        setDeploymentError({
          type: "MISSING_ENV_VARS",
          title: "Missing Environment Variables",
          message:
            "Required environment variables are not configured. This may cause the application to fail:",
          details: [
            !supabaseUrl && "VITE_SUPABASE_URL is missing",
            !supabaseKey && "VITE_SUPABASE_PUBLISHABLE_KEY is missing",
          ].filter(Boolean),
          suggestions: [
            "Go to Vercel project settings → Environment Variables",
            "Add VITE_SUPABASE_URL with your Supabase project URL",
            "Add VITE_SUPABASE_PUBLISHABLE_KEY with your Supabase anon key",
            "Redeploy the application after adding variables",
            "Verify variables are set for Production environment",
          ],
          severity: "warning",
        });
        if (onErrorDetected) {
          onErrorDetected("MISSING_ENV_VARS");
        }
      }
    };

    // * Check for build errors (404s on assets)
    const checkBuildErrors = () => {
      // * Monitor for 404 errors on asset files via image loading
      const images = document.querySelectorAll("img[src*='/assets/']");
      images.forEach((img) => {
        img.addEventListener("error", () => {
          setDeploymentError({
            type: "BUILD_ERROR",
            title: "Build Asset Not Found",
            message: `Failed to load asset: ${img.src}`,
            details: [
              "The build output may be missing files",
              "Asset paths may be incorrect",
              "Vite build may have failed or been incomplete",
            ],
            suggestions: [
              "Check Vercel build logs for errors",
              "Verify build completed successfully",
              "Check that dist/ directory contains all assets",
              "Review vite.config.ts base path configuration",
              "Try rebuilding the application",
            ],
            severity: "critical",
          });
          if (onErrorDetected) {
            onErrorDetected("BUILD_ERROR");
          }
        });
      });
    };

    // * Run all checks
    checkScriptLoading();
    checkCSPViolations();
    checkEnvironmentVariables();
    checkBuildErrors();

    // * Cleanup
    return () => {
      // * Restore original fetch if we modified it
      if (window.fetch !== fetch) {
        window.fetch = fetch;
      }
    };
  }, [onErrorDetected]);

  if (!deploymentError) {
    return null;
  }

  const handleReload = () => {
    window.location.reload();
  };

  const handleCopyError = async () => {
    const errorText = `# Deployment Error Report

**Type**: ${deploymentError.type}
**Title**: ${deploymentError.title}
**Severity**: ${deploymentError.severity}

## Message
${deploymentError.message}

## Details
${deploymentError.details.map((d) => `- ${d}`).join("\n")}

## Suggestions
${deploymentError.suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n")}

## Environment
- **URL**: ${window.location.href}
- **User Agent**: ${navigator.userAgent}
- **Timestamp**: ${new Date().toISOString()}
${cspViolations.length > 0 ? `\n## CSP Violations\n${cspViolations.map((v, i) => `${i + 1}. ${v.violatedDirective}: ${v.blockedURI}`).join("\n")}` : ""}
${deploymentError.cspViolation ? `\n## CSP Violation Details\n- Blocked URI: ${deploymentError.cspViolation.blockedURI}\n- Violated Directive: ${deploymentError.cspViolation.violatedDirective}\n- Original Policy: ${deploymentError.cspViolation.originalPolicy}` : ""}
`;

    try {
      await navigator.clipboard.writeText(errorText);
      alert("Error details copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy error details:", err);
    }
  };

  return (
    <div className={styles.deploymentError} role="alert">
      <div className={styles.deploymentErrorContent}>
        <div className={styles.deploymentErrorIcon}>⚠️</div>
        <h2 className={styles.deploymentErrorTitle}>
          {deploymentError.title}
        </h2>
        <p className={styles.deploymentErrorMessage}>
          {deploymentError.message}
        </p>

        {deploymentError.details && deploymentError.details.length > 0 && (
          <div className={styles.deploymentErrorDetails}>
            <h3>Details:</h3>
            <ul>
              {deploymentError.details.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
          </div>
        )}

        {deploymentError.suggestions &&
          deploymentError.suggestions.length > 0 && (
            <div className={styles.deploymentErrorSuggestions}>
              <h3>How to Fix:</h3>
              <ol>
                {deploymentError.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ol>
            </div>
          )}

        {cspViolations.length > 0 && (
          <div className={styles.deploymentErrorCSP}>
            <h3>CSP Violations Detected:</h3>
            <ul>
              {cspViolations.map((violation, index) => (
                <li key={index}>
                  <strong>{violation.violatedDirective}:</strong>{" "}
                  {violation.blockedURI || "Unknown"}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.deploymentErrorActions}>
          <button
            onClick={handleReload}
            className={styles.deploymentErrorButton}
            type="button"
          >
            Reload Page
          </button>
          <button
            onClick={handleCopyError}
            className={styles.deploymentErrorButton}
            type="button"
          >
            Copy Error Details
          </button>
        </div>

        {process.env.NODE_ENV === "development" && (
          <details className={styles.deploymentErrorDebug}>
            <summary>Debug Information</summary>
            <pre>{JSON.stringify(deploymentError, null, 2)}</pre>
          </details>
        )}
      </div>
    </div>
  );
}

DeploymentErrorDetector.propTypes = {
  onErrorDetected: PropTypes.func,
};

DeploymentErrorDetector.defaultProps = {
  onErrorDetected: undefined,
};

export default DeploymentErrorDetector;
