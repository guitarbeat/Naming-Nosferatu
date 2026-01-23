import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ToastProvider } from "./providers/ToastProvider";
import { queryClient } from "./services/supabase/queryClient";
import "@styles/index.css";

// #region agent log - hypothesis A,B,C,D,E
// Capture console logs for CSS debugging
const originalConsoleLog = console.log;
console.log = function(...args) {
  // Send CSS debug logs to debug server
  if (args[0] && typeof args[0] === 'string' && args[0].startsWith('[CSS_DEBUG]')) {
    fetch('http://127.0.0.1:7242/ingest/d92f4171-d3eb-4b5d-a7ad-96b5b64382bb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'main.tsx:CSS_DEBUG',
        message: args.join(' '),
        data: { args, timestamp: Date.now() },
        sessionId: 'debug-session',
        runId: 'css-analysis',
        hypothesisId: 'A,B,C,D,E'
      })
    }).catch(() => {});
  }
  // Call original console.log
  originalConsoleLog.apply(console, args);
};

// Add CSS loading instrumentation
setTimeout(() => {
  console.log('[CSS_DEBUG] Starting CSS cascade analysis at', Date.now());
  console.log('[CSS_DEBUG] Checking CSS variables:');
  console.log('[CSS_DEBUG] --primary-color value:', getComputedStyle(document.documentElement).getPropertyValue('--primary-color'));
  console.log('[CSS_DEBUG] --transition-all value:', getComputedStyle(document.documentElement).getPropertyValue('--transition-all'));

  // Check for duplicate CSS classes
  const stylesheets = Array.from(document.styleSheets);
  console.log('[CSS_DEBUG] Found', stylesheets.length, 'stylesheets');

  stylesheets.forEach((sheet, index) => {
    try {
      const rules = Array.from(sheet.cssRules || []);
      const flex1Rules = rules.filter(rule => rule.selectorText === '.flex-1');
      const fullScreenCenterRules = rules.filter(rule => rule.selectorText === '.fullScreenCenter');

      if (flex1Rules.length > 1) {
        console.log('[CSS_DEBUG] DUPLICATE .flex-1 found in stylesheet', index, '- rules:', flex1Rules.length);
        flex1Rules.forEach((rule, ruleIndex) => {
          console.log('[CSS_DEBUG] .flex-1 rule', ruleIndex, ':', rule.cssText);
        });
      }

      if (fullScreenCenterRules.length > 1) {
        console.log('[CSS_DEBUG] DUPLICATE .fullScreenCenter found in stylesheet', index, '- rules:', fullScreenCenterRules.length);
        fullScreenCenterRules.forEach((rule, ruleIndex) => {
          console.log('[CSS_DEBUG] .fullScreenCenter rule', ruleIndex, ':', rule.cssText);
        });
      }
    } catch (e) {
      console.log('[CSS_DEBUG] Could not access stylesheet', index, ':', e.message);
    }
  });

  console.log('[CSS_DEBUG] CSS analysis complete at', Date.now());
}, 1000); // Wait 1 second for CSS to load
// #endregion

const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error("Root element #root not found");
}

ReactDOM.createRoot(rootElement).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<ToastProvider>
				<BrowserRouter>
					<App />
				</BrowserRouter>
			</ToastProvider>
		</QueryClientProvider>
	</React.StrictMode>,
);
