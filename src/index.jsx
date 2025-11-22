/**
 * @module index
 * @description Application entry point. Renders the main App component
 * into the DOM and sets up React's StrictMode for development checks.
 *
 * @requires React
 * @requires ReactDOM
 * @requires App
 */

// * Debug code removed - testing clean app

import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { setupGlobalErrorHandling } from "@services/errorManager";
import "@styles/index.css";
import App from "./App.jsx";
import ErrorBoundary from "./shared/components/Error/ErrorBoundary.jsx";
import ErrorBoundaryFallback from "./shared/components/Error/ErrorBoundaryFallback.jsx";

/**
 * * Safely converts a value to a string for logging
 * @param {*} value - Value to convert
 * @returns {string} String representation
 */
function safeStringifyForLog(value) {
  if (value === null || value === undefined) {
    return String(value);
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "object") {
    try {
      // Try JSON.stringify first
      return JSON.stringify(value);
    } catch {
      // If that fails, try to get a basic representation
      try {
        if (value instanceof Error) {
          return `Error: ${value.name || "Error"} - ${value.message || "No message"}`;
        }
        if (value.constructor && value.constructor.name) {
          return `[${value.constructor.name}]`;
        }
        return "[Object]";
      } catch {
        return "[Unable to stringify]";
      }
    }
  }
  try {
    return String(value);
  } catch {
    return "[Unable to convert]";
  }
}

/**
 * * Wraps console.error to safely handle non-stringifiable objects
 * This prevents "Cannot convert object to primitive value" errors
 * that can occur when React's lazy loading tries to log errors
 */
function setupSafeConsoleError() {
  const originalConsoleError = console.error;
  console.error = function (...args) {
    try {
      // * Safely stringify all arguments before logging
      const safeArgs = args.map((arg) => {
        try {
          // * Try to use the original value if it's already safe
          String(arg);
          return arg;
        } catch {
          // * If conversion fails, use safe stringified version
          return safeStringifyForLog(arg);
        }
      });
      originalConsoleError.apply(console, safeArgs);
    } catch (err) {
      // * If even the safe logging fails, use the most basic fallback
      try {
        originalConsoleError("[Console.error wrapper failed]", err);
      } catch {
        // * Last resort - do nothing to prevent infinite loops
      }
    }
  };
}

// * Set up safe console.error wrapper before anything else
setupSafeConsoleError();

// Set up global error handling
setupGlobalErrorHandling();

// Boot log to verify app mounting during preview
if (process.env.NODE_ENV === "development") {
  console.info("[Boot] index.jsx loaded");
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
