interface ErrorInfo {
	title: string;
	message: string;
	details?: string[];
	suggestions?: string[];
	consoleErrors?: string[];
	diagnostics?: DiagnosticResult[];
}

interface DiagnosticResult {
	name: string;
	status: "ok" | "warning" | "error" | "unknown";
	value?: string;
	hint?: string;
}

const ErrorDisplayId = "deployment-error-display";
const MaxWaitTime = 5000; // 5 seconds

// Capture console errors before React loads
const capturedErrors: string[] = [];
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
	const message = args
		.map((arg) => {
			if (arg instanceof Error) {
				return `${arg.name}: ${arg.message}`;
			}
			if (typeof arg === "object") {
				return JSON.stringify(arg, null, 2);
			}
			return String(arg);
		})
		.join(" ");
	capturedErrors.push(message);
	originalConsoleError.apply(console, args);
};

// Also capture unhandled errors
window.addEventListener("error", (event) => {
	const errorMsg = event.error
		? `${event.error.name || "Error"}: ${event.error.message}`
		: event.message;
	capturedErrors.push(`[Uncaught] ${errorMsg} at ${event.filename}:${event.lineno}:${event.colno}`);
});

window.addEventListener("unhandledrejection", (event) => {
	const reason = event.reason;
	const errorMsg =
		reason instanceof Error
			? `${reason.name}: ${reason.message}`
			: typeof reason === "string"
				? reason
				: JSON.stringify(reason);
	capturedErrors.push(`[Unhandled Promise] ${errorMsg}`);
});

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

function runDiagnostics(): DiagnosticResult[] {
	const results: DiagnosticResult[] = [];

	// Check network status
	results.push({
		name: "Network",
		status: navigator.onLine ? "ok" : "error",
		value: navigator.onLine ? "Online" : "Offline",
		hint: navigator.onLine ? undefined : "Check your internet connection",
	});

	// Check if root element exists
	const root = document.getElementById("root");
	results.push({
		name: "Root Element",
		status: root ? "ok" : "error",
		value: root ? "Found" : "Missing",
		hint: root ? undefined : "index.html may be corrupted",
	});

	// Check for module scripts
	const scripts = document.querySelectorAll('script[type="module"]');
	results.push({
		name: "Module Scripts",
		status: scripts.length > 0 ? "ok" : "error",
		value: `${scripts.length} found`,
		hint: scripts.length === 0 ? "Build may have failed" : undefined,
	});

	// Check localStorage access
	try {
		localStorage.setItem("__test__", "1");
		localStorage.removeItem("__test__");
		results.push({ name: "localStorage", status: "ok", value: "Accessible" });
	} catch {
		results.push({
			name: "localStorage",
			status: "warning",
			value: "Blocked",
			hint: "Some features may not work",
		});
	}

	// Check for console errors
	results.push({
		name: "Console Errors",
		status: capturedErrors.length === 0 ? "ok" : "error",
		value: capturedErrors.length === 0 ? "None" : `${capturedErrors.length} error(s)`,
		hint: capturedErrors.length > 0 ? "Check error details below" : undefined,
	});

	return results;
}

function renderDiagnostics(diagnostics: DiagnosticResult[]): HTMLElement | null {
	if (!diagnostics || diagnostics.length === 0) {
		return null;
	}

	const section = document.createElement("div");
	section.className = "deployment-error__section";
	section.style.background = "#fafafa";
	section.style.borderLeftColor = "#3b82f6";

	const title = document.createElement("h3");
	title.className = "deployment-error__section-title";
	title.style.display = "flex";
	title.style.alignItems = "center";
	title.style.gap = "8px";

	const titleSpan = document.createElement("span");
	titleSpan.style.fontSize = "16px";
	titleSpan.textContent = "Diagnostics";
	title.appendChild(titleSpan);
	section.appendChild(title);

	const table = document.createElement("table");
	table.style.width = "100%";
	table.style.borderCollapse = "collapse";
	table.style.fontSize = "14px";
	table.style.marginTop = "8px";

	const thead = document.createElement("thead");
	const headRow = document.createElement("tr");
	headRow.style.background = "#f3f4f6";
	headRow.style.textAlign = "left";

	["Check", "Status", "Value", "Hint"].forEach((text, i) => {
		const th = document.createElement("th");
		th.style.padding = "8px 12px";
		if (i === 1) th.style.textAlign = "center";
		th.textContent = text;
		headRow.appendChild(th);
	});
	thead.appendChild(headRow);
	table.appendChild(thead);

	const tbody = document.createElement("tbody");
	for (const d of diagnostics) {
		const tr = document.createElement("tr");
		tr.style.borderBottom = "1px solid #e5e7eb";

		const nameTd = document.createElement("td");
		nameTd.style.padding = "8px 12px";
		nameTd.style.fontWeight = "500";
		nameTd.textContent = d.name;
		tr.appendChild(nameTd);

		const statusTd = document.createElement("td");
		statusTd.style.padding = "8px 12px";
		statusTd.style.textAlign = "center";
		const statusSpan = document.createElement("span");
		if (d.status === "ok") {
			statusSpan.style.color = "#22c55e";
			statusSpan.textContent = "\u2713"; // ✓
		} else if (d.status === "warning") {
			statusSpan.style.color = "#eab308";
			statusSpan.textContent = "\u26A0"; // ⚠
		} else if (d.status === "error") {
			statusSpan.style.color = "#ef4444";
			statusSpan.textContent = "\u2717"; // ✕
		} else {
			statusSpan.style.color = "#6b7280";
			statusSpan.textContent = "?";
		}
		statusTd.appendChild(statusSpan);
		tr.appendChild(statusTd);

		const valueTd = document.createElement("td");
		valueTd.style.padding = "8px 12px";
		valueTd.style.fontFamily = "monospace";
		valueTd.style.fontSize = "12px";
		valueTd.textContent = d.value || "-";
		tr.appendChild(valueTd);

		const hintTd = document.createElement("td");
		hintTd.style.padding = "8px 12px";
		hintTd.style.color = "#6b7280";
		hintTd.style.fontSize = "12px";
		hintTd.textContent = d.hint || "";
		tr.appendChild(hintTd);

		tbody.appendChild(tr);
	}
	table.appendChild(tbody);
	section.appendChild(table);

	return section;
}

function renderConsoleErrors(errors: string[]): HTMLElement | null {
	if (!errors || errors.length === 0) {
		return null;
	}

	const section = document.createElement("div");
	section.className = "deployment-error__section";
	section.style.background = "#fef2f2";
	section.style.borderLeftColor = "#ef4444";

	const title = document.createElement("h3");
	title.className = "deployment-error__section-title";
	title.style.color = "#dc2626";
	title.style.display = "flex";
	title.style.alignItems = "center";
	title.style.justifyContent = "space-between";

	const titleSpan = document.createElement("span");
	titleSpan.textContent = `Console Errors (${errors.length})`;
	title.appendChild(titleSpan);

	const copyBtn = document.createElement("button");
	copyBtn.type = "button";
	copyBtn.textContent = "Copy All";
	copyBtn.style.marginLeft = "auto";
	copyBtn.style.padding = "4px 12px";
	copyBtn.style.fontSize = "12px";
	copyBtn.style.background = "#dc2626";
	copyBtn.style.color = "white";
	copyBtn.style.border = "none";
	copyBtn.style.borderRadius = "4px";
	copyBtn.style.cursor = "pointer";
	copyBtn.setAttribute("onclick", "copyErrorsToClipboard()");
	title.appendChild(copyBtn);
	section.appendChild(title);

	const container = document.createElement("div");
	container.style.maxHeight = "200px";
	container.style.overflowY = "auto";
	container.style.marginTop = "8px";

	for (const err of errors.slice(0, 10)) {
		const errDiv = document.createElement("div");
		errDiv.style.background = "#1f2937";
		errDiv.style.padding = "8px 12px";
		errDiv.style.borderRadius = "4px";
		errDiv.style.marginBottom = "4px";
		errDiv.style.fontFamily = "monospace";
		errDiv.style.fontSize = "11px";
		errDiv.style.color = "#f87171";
		errDiv.style.whiteSpace = "pre-wrap";
		errDiv.style.wordBreak = "break-all";
		errDiv.style.maxHeight = "80px";
		errDiv.style.overflow = "auto";
		errDiv.textContent = err;
		container.appendChild(errDiv);
	}
	section.appendChild(container);

	if (errors.length > 10) {
		const moreMsg = document.createElement("p");
		moreMsg.style.color = "#6b7280";
		moreMsg.style.fontSize = "12px";
		moreMsg.style.marginTop = "8px";
		moreMsg.textContent = `Showing first 10 of ${errors.length} errors`;
		section.appendChild(moreMsg);
	}

	return section;
}

function renderDeploymentList(
	title: string,
	items: string[] | undefined,
	listTag: "ol" | "ul",
): HTMLElement | null {
	if (!items || items.length === 0) {
		return null;
	}

	const section = document.createElement("div");
	section.className = "deployment-error__section";

	const h3 = document.createElement("h3");
	h3.className = "deployment-error__section-title";
	h3.textContent = title;
	section.appendChild(h3);

	const list = document.createElement(listTag);
	list.className = "deployment-error__list";

	for (const item of items) {
		const li = document.createElement("li");
		li.className = "deployment-error__list-item";
		li.textContent = item;
		list.appendChild(li);
	}
	section.appendChild(list);

	return section;
}

// Expose copy function globally for the button
(window as unknown as { copyErrorsToClipboard: () => void }).copyErrorsToClipboard = () => {
	const errorText = capturedErrors.join("\n\n---\n\n");
	const diagnostics = runDiagnostics();
	const diagnosticText = diagnostics
		.map((d) => `${d.name}: ${d.status} - ${d.value}${d.hint ? ` (${d.hint})` : ""}`)
		.join("\n");

	const fullReport = `
=== Deployment Error Report ===
Generated: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}

=== Diagnostics ===
${diagnosticText}

=== Console Errors ===
${errorText || "No errors captured"}
`.trim();

	navigator.clipboard.writeText(fullReport).then(
		() => {
			const btn = document.querySelector(
				'#deployment-error-display button[onclick="copyErrorsToClipboard()"]',
			) as HTMLButtonElement;
			if (btn) {
				const original = btn.textContent;
				btn.textContent = "Copied!";
				btn.style.background = "#22c55e";
				setTimeout(() => {
					btn.textContent = original;
					btn.style.background = "#dc2626";
				}, 2000);
			}
		},
		() => {
			alert("Failed to copy to clipboard");
		},
	);
};

/**
 * Displays a full-screen error overlay when deployment issues are detected.
 * This runs before React loads to catch initialization failures.
 */
function showDeploymentError(errorInfo: ErrorInfo): void {
	clearDeploymentError();

	const diagnostics = runDiagnostics();
	const consoleErrors = capturedErrors.slice();

	const errorDiv = document.createElement("div");
	errorDiv.id = ErrorDisplayId;

	const content = document.createElement("div");
	content.className = "deployment-error__panel";
	content.style.maxHeight = "90vh";
	content.style.overflowY = "auto";

	const icon = document.createElement("div");
	icon.className = "deployment-error__icon";
	icon.setAttribute("aria-hidden", "true");
	icon.textContent = "\u26A0"; // ⚠
	content.appendChild(icon);

	const h2 = document.createElement("h2");
	h2.className = "deployment-error__title";
	h2.textContent = errorInfo.title;
	content.appendChild(h2);

	const p = document.createElement("p");
	p.className = "deployment-error__message";
	p.textContent = errorInfo.message;
	content.appendChild(p);

	const diagSection = renderDiagnostics(diagnostics);
	if (diagSection) content.appendChild(diagSection);

	const errorSection = renderConsoleErrors(consoleErrors);
	if (errorSection) content.appendChild(errorSection);

	const detailsList = renderDeploymentList("Details:", errorInfo.details, "ul");
	if (detailsList) content.appendChild(detailsList);

	const fixList = renderDeploymentList("How to Fix:", errorInfo.suggestions, "ol");
	if (fixList) content.appendChild(fixList);

	const buttonRow = document.createElement("div");
	buttonRow.className = "deployment-error__button-row";

	const reloadBtn = document.createElement("button");
	reloadBtn.type = "button";
	reloadBtn.className = "deployment-error__button";
	reloadBtn.textContent = "Reload Page";
	reloadBtn.onclick = () => window.location.reload();
	buttonRow.appendChild(reloadBtn);

	const dismissBtn = document.createElement("button");
	dismissBtn.type = "button";
	dismissBtn.className = "deployment-error__button";
	dismissBtn.style.background = "#6b7280";
	dismissBtn.textContent = "Dismiss";
	dismissBtn.onclick = () => {
		const display = document.getElementById(ErrorDisplayId);
		if (display) display.remove();
	};
	buttonRow.appendChild(dismissBtn);

	content.appendChild(buttonRow);

	const footer = document.createElement("p");
	footer.style.textAlign = "center";
	footer.style.color = "#9ca3af";
	footer.style.fontSize = "11px";
	footer.style.marginTop = "16px";
	footer.textContent = "Press F12 to open browser DevTools for more details";
	content.appendChild(footer);

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
