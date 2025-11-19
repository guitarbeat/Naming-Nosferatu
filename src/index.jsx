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
import "@styles/reset.css";
import "@styles/colors.css";
import "@styles/effects.css";
import "@styles/typography.css";
import "@styles/spacing.css";
import "@styles/layout.css";
import "@styles/borders.css";
import "@styles/transitions.css";
import "@styles/z-index.css";
import "@styles/mobile.css";
import "@styles/buttons.css";
import "@styles/glass.css";
import "@styles/shimmer.css";
import "@styles/theme-light.css";
import "@styles/theme-dark.css";
import "@styles/theme-high-contrast.css";
import "@styles/utilities-layout.css";
import "@styles/utilities-spacing.css";
import "@styles/utilities-typography.css";
import "@styles/utilities-misc.css";
import "@styles/utilities-card.css";
import "@styles/utilities-scroll-to-top.css";
import "@styles/utilities-button.css";
import "@styles/utilities-form.css";
import "@styles/utilities-feedback.css";
import "@styles/utilities-responsive.css";
import "@styles/animations.css";
import "@styles/background-effects.css";
import "@styles/components-global.css";
import "@styles/app-layout.css";
import "@styles/responsive-variables.css";
import "@styles/responsive-global.css";
import "@styles/responsive-small-mobile.css";
import "@styles/responsive-touch.css";
import "@styles/responsive-high-contrast.css";
import "@styles/responsive-reduced-motion.css";
import "@styles/responsive-safe-area.css";
import "@styles/responsive-landscape.css";
import "@styles/cursor-interactions.css";
import App from "./App.jsx";
import ErrorBoundary from "./shared/components/Error/ErrorBoundary.jsx";
import ErrorBoundaryFallback from "./shared/components/Error/ErrorBoundaryFallback.jsx";
// import { Analytics } from '@vercel/analytics/react';

// Set up global error handling
setupGlobalErrorHandling();

// Boot log to verify app mounting during preview
console.info("[Boot] index.jsx loaded");

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
      <App />
      {/* <Analytics /> */}
    </ErrorBoundary>
  </StrictMode>,
);
