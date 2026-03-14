interface ErrorInfo {
	title: string;
	message: string;
	details?: string[];
	suggestions?: string[];
}

const ErrorDisplayId = "deployment-error-display";
const MaxWaitTime = 5000; // 5 seconds

function clearDeploymentError(): void {
	const existing = document.getElementById(ErrorDisplayId);
	if (existing) {
		existing.remove();
	}
}

function getMainModuleScript(): HTMLScriptElement | null {
	const moduleScripts = Array.from(
		document.querySelectorAll<HTMLScriptElement>('script[type="module"][src]'),
	);

	if (moduleScripts.length > 0) {
		return moduleScripts[moduleScripts.length - 1] ?? null;
	}

	return document.querySelector<HTMLScriptElement>('script[src*="index"]');
}

function renderDeploymentList(
	title: string,
	items: string[] | undefined,
	listTag: "ol" | "ul",
): string {
	if (!items || items.length === 0) {
		return "";
	}

	return `
		<div class="deployment-error__section">
			<h3 class="deployment-error__section-title">${title}</h3>
			<${listTag} class="deployment-error__list">
				${items.map((item) => `<li class="deployment-error__list-item">${item}</li>`).join("")}
			</${listTag}>
		</div>
	`;
}

/**
 * Displays a full-screen error overlay when deployment issues are detected.
 * This runs before React loads to catch initialization failures.
 */
function showDeploymentError(errorInfo: ErrorInfo): void {
	clearDeploymentError();

	const errorDiv = document.createElement("div");
	errorDiv.id = ErrorDisplayId;

	const content = document.createElement("div");
	content.className = "deployment-error__panel";

	content.innerHTML = `
		<div class="deployment-error__icon" aria-hidden="true">⚠️</div>
		<h2 class="deployment-error__title">${errorInfo.title}</h2>
		<p class="deployment-error__message">${errorInfo.message}</p>
		${renderDeploymentList("Details:", errorInfo.details, "ul")}
		${renderDeploymentList("How to Fix:", errorInfo.suggestions, "ol")}
		<div class="deployment-error__button-row">
			<button type="button" class="deployment-error__button" onclick="window.location.reload()">Reload Page</button>
		</div>
	`;

	errorDiv.appendChild(content);
	document.body.appendChild(errorDiv);
}

export function initDeploymentCheck(): void {
	// Check if root element exists
	const root = document.getElementById("root");
	if (!root) {
		showDeploymentError({
			title: "Root Element Missing",
			message: "The application root element (#root) was not found in the HTML.",
			suggestions: [
				'Verify index.html contains <div id="root"></div>',
				"Check that the HTML file is being served correctly",
			],
		});
		return;
	}

	// Monitor script loading
	const mainScript = getMainModuleScript();

	if (mainScript) {
		let scriptLoaded = root.children.length > 0;
		let scriptError = false;
		const observer = new MutationObserver(() => {
			if (root.children.length > 0) {
				clearDeploymentError();
			}
		});

		observer.observe(root, { childList: true });

		mainScript.addEventListener("load", () => {
			scriptLoaded = true;
		});

		mainScript.addEventListener("error", () => {
			scriptError = true;
			showDeploymentError({
				title: "JavaScript Failed to Load",
				message: "The application's JavaScript files could not be loaded. This is often caused by:",
				details: [
					"Content Security Policy (CSP) blocking scripts",
					"Incorrect build output paths",
					"Missing or incorrect base path configuration",
					"Network issues preventing script downloads",
				],
				suggestions: [
					'Check browser console for CSP violations (look for "Content-Security-Policy" errors)',
					"Verify that script files exist in the /assets/js/ directory",
					"Check Network tab to see if scripts return 404 or are blocked",
					"Review vercel.json CSP configuration",
					"Ensure Vite build completed successfully",
				],
			});
		});

		// Check if app initialized after timeout
		setTimeout(() => {
			if (scriptError || root.children.length > 0) {
				observer.disconnect();
				return;
			}

			showDeploymentError({
				title: scriptLoaded ? "Application Failed to Initialize" : "Application Startup Delayed",
				message: scriptLoaded
					? "The JavaScript loaded but the application failed to mount into the page. Possible causes:"
					: "The application is taking longer than expected to download or initialize. Possible causes:",
				details: scriptLoaded
					? [
							"JavaScript errors preventing React from mounting",
							"Missing environment variables (VITE_SUPABASE_URL, etc.)",
							"Build configuration issues",
							"Runtime errors in the application code",
						]
					: [
							"Slow script downloads or blocked JavaScript resources",
							"Vite or CDN startup delays",
							"Network issues preventing the main bundle from loading",
							"Runtime initialization work taking too long",
						],
				suggestions: scriptLoaded
					? [
							"Open browser console (F12) and check for JavaScript errors",
							"Verify all required environment variables are set in Vercel",
							"Check that the build completed without errors",
							"Review the error boundary fallback for more details",
							"Try rebuilding the application",
						]
					: [
							"Wait a moment and reload if the page is still blank",
							"Check the Network tab for a slow or blocked main bundle",
							"Verify the deployed assets are reachable from the current origin",
							"Review the hosting logs for slow startup or CDN failures",
						],
			});
		}, MaxWaitTime);
	}

	// Monitor CSP violations
	document.addEventListener("securitypolicyviolation", (event) => {
		if (event.violatedDirective === "script-src" || event.effectiveDirective === "script-src") {
			showDeploymentError({
				title: "Content Security Policy Violation",
				message: "The application's scripts are being blocked by Content Security Policy:",
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
			});
		}
	});
}

// Auto-initialize if running in browser context
if (typeof window !== "undefined") {
	initDeploymentCheck();
}
