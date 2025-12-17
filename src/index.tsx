// @ts-nocheck
/**
 * @module index
 * @description Application entry point. Renders the main App component
 * into the DOM and sets up React's StrictMode for development checks.
 *
 * @requires React
 * @requires ReactDOM
 * @requires App
 */

import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { HeroUIProvider } from "@heroui/react";
import { setupGlobalErrorHandling } from "@services/errorManager";
import { queryClient } from "@services/supabase/queryClient";
import "@styles/index.css";
import App from "./App.jsx";
import ErrorBoundary from "./shared/components/Error/ErrorBoundary.jsx";
import ErrorBoundaryFallback from "./shared/components/Error/ErrorBoundaryFallback.jsx";
import DeploymentErrorDetector from "./shared/components/DeploymentErrorDetector/DeploymentErrorDetector.jsx";

/**
 * * Registers the service worker in production builds only.
 * * Includes an update flow that forces waiting workers to activate
 * * so users are less likely to stay on a stale bundle.
 */
function registerServiceWorker() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) {
    return;
  }

  const handleControllerChange = () => {
    window.location.reload();
  };

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        const trySkipWaiting = (worker) => {
          if (!worker) {
            return;
          }
          worker.postMessage({ type: "SKIP_WAITING" });
        };

        // * Immediately activate a waiting worker after registration
        trySkipWaiting(registration.waiting);

        registration.addEventListener("updatefound", () => {
          const { installing } = registration;
          if (!installing) {
            return;
          }
          installing.addEventListener("statechange", () => {
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              trySkipWaiting(installing);
            }
          });
        });
      })
      .catch((error) => {
        console.error("[ServiceWorker] Registration failed:", error);
      });
  });

  navigator.serviceWorker.addEventListener(
    "controllerchange",
    handleControllerChange,
  );
}

// * Check for required environment variables before app initialization
const checkEnvironmentVariables = () => {
  const supabaseKey =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY;

  const requiredVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY_OR_ANON_KEY: supabaseKey,
  };

  const missing = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    // #region agent log
    const LOG_ENDPOINT = `http://${window.location.hostname}:7242/ingest/1f557b52-909f-4217-87a5-26efd857b93b`;
    fetch(LOG_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "H3",
        location: "index.jsx:env-check",
        message: "missing env vars",
        data: { missing, env: import.meta.env.MODE },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    const errorMessage = `Missing required environment variables: ${missing.join(", ")}`;
    console.error(`[App Initialization] ${errorMessage}`);
    console.error(
      `\nTo fix this:\n` +
        `1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables\n` +
        `2. Add the missing variables:\n${missing
          .map((key) => `   - ${key}`)
          .join("\n")}\n3. Redeploy the application\n`,
    );

    // * Display error in the DOM before React mounts
    const root = document.getElementById("root");
    if (root && !root.querySelector("[data-env-error]")) {
      root.innerHTML = `
        <div data-env-error="true">
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #f5f5f5;
        ">
          <div style="
            background: white;
            border-radius: 12px;
            padding: 2rem;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          ">
            <div style="font-size: 3rem; text-align: center; margin-bottom: 1rem;">⚠️</div>
            <h1 style="font-size: 1.5rem; font-weight: 700; margin: 0 0 1rem; color: #dc2626; text-align: center;">
              Configuration Error
            </h1>
            <p style="font-size: 1rem; line-height: 1.6; margin: 0 0 1.5rem; color: #666;">
              The application is missing required environment variables:
            </p>
            <ul style="margin: 0 0 1.5rem; padding-left: 1.5rem; color: #666;">
              ${missing.map((key) => `<li style="margin: 0.5rem 0;">${key}</li>`).join("")}
            </ul>
            <div style="padding: 1rem; background: #f5f5f5; border-radius: 8px; margin-bottom: 1.5rem;">
              <h2 style="font-size: 1rem; font-weight: 600; margin: 0 0 0.75rem;">How to Fix:</h2>
              <ol style="margin: 0; padding-left: 1.5rem; color: #666;">
                <li style="margin: 0.5rem 0;">Go to Vercel Dashboard → Your Project → Settings → Environment Variables</li>
                <li style="margin: 0.5rem 0;">Add the missing variables listed above</li>
                <li style="margin: 0.5rem 0;">Redeploy the application</li>
              </ol>
            </div>
            <button onclick="window.location.reload()" style="
              width: 100%;
              padding: 0.75rem 1.5rem;
              background: #2563eb;
              color: white;
              border: none;
              border-radius: 6px;
              font-size: 1rem;
              font-weight: 600;
              cursor: pointer;
            ">Reload Page</button>
          </div>
        </div>
        </div>
      `;
    }
    // * Throw error to prevent React from mounting
    throw new Error(errorMessage);
  }
  // #region agent log
  const LOG_ENDPOINT = `http://${window.location.hostname}:7242/ingest/1f557b52-909f-4217-87a5-26efd857b93b`;
  fetch(LOG_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "debug-session",
      runId: "run1",
      hypothesisId: "H3",
      location: "index.jsx:env-check",
      message: "env vars ok",
      data: { mode: import.meta.env.MODE },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
};

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

registerServiceWorker();

// * Check environment variables before mounting React
let envCheckPassed = false;
try {
  checkEnvironmentVariables();
  envCheckPassed = true;
} catch (error) {
  // * Error already displayed in DOM via checkEnvironmentVariables
  // * Don't mount React if environment variables are missing
  console.error(
    "[App Initialization] Failed environment variable check:",
    error,
  );
  // #region agent log
  const LOG_ENDPOINT = `http://${window.location.hostname}:7242/ingest/1f557b52-909f-4217-87a5-26efd857b93b`;
  fetch(LOG_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "debug-session",
      runId: "run1",
      hypothesisId: "H3",
      location: "index.jsx:env-check-catch",
      message: "env check failed",
      data: { error: String(error) },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

// * Only mount React if environment check passed
if (envCheckPassed) {
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(
    <StrictMode>
      <HeroUIProvider>
        <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
          <QueryClientProvider client={queryClient}>
            <DeploymentErrorDetector />
            <App />
          </QueryClientProvider>
        </ErrorBoundary>
      </HeroUIProvider>
    </StrictMode>,
  );
}
