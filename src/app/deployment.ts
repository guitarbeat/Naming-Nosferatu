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

	const titleText = document.createElement("span");
	titleText.style.fontSize = "16px";
	titleText.textContent = "Diagnostics";
	title.appendChild(titleText);
	section.appendChild(title);

	const table = document.createElement("table");
	table.style.width = "100%";
	table.style.borderCollapse = "collapse";
	table.style.fontSize = "14px";
	table.style.marginTop = "8px";

	const thead = document.createElement("thead");
	const headerRow = document.createElement("tr");
	headerRow.style.background = "#f3f4f6";
	headerRow.style.textAlign = "left";

	for (const text of ["Check", "Status", "Value", "Hint"]) {
		const th = document.createElement("th");
		th.style.padding = "8px 12px";
		if (text === "Status") {
			th.style.textAlign = "center";
		}
		th.textContent = text;
		headerRow.appendChild(th);
	}
	thead.appendChild(headerRow);
	table.appendChild(thead);

	const tbody = document.createElement("tbody");

	const statusIcons: Record<string, { char: string; color: string }> = {
		ok: { char: "\u2713", color: "#22c55e" },
		warning: { char: "\u26A0", color: "#eab308" },
		error: { char: "\u2717", color: "#ef4444" },
		unknown: { char: "?", color: "#6b7280" },
	};

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
		const icon = statusIcons[d.status] || statusIcons.unknown;
		const iconSpan = document.createElement("span");
		iconSpan.style.color = icon.color;
		iconSpan.textContent = icon.char;
		statusTd.appendChild(iconSpan);
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

	const titleText = document.createElement("span");
	titleText.textContent = `Console Errors (${errors.length})`;
	title.appendChild(titleText);

	const copyBtn = document.createElement("button");
	copyBtn.type = "button";
	copyBtn.className = "copy-errors-button";
	copyBtn.style.marginLeft = "auto";
	copyBtn.style.padding = "4px 12px";
	copyBtn.style.fontSize = "12px";
	copyBtn.style.background = "#dc2626";
	copyBtn.style.color = "white";
	copyBtn.style.border = "none";
	copyBtn.style.borderRadius = "4px";
	copyBtn.style.cursor = "pointer";
	copyBtn.textContent = "Copy All";
	copyBtn.addEventListener("click", () => {
		(window as unknown as { copyErrorsToClipboard: () => void }).copyErrorsToClipboard();
	});
	title.appendChild(copyBtn);
	section.appendChild(title);

	const errorContainer = document.createElement("div");
	errorContainer.style.maxHeight = "200px";
	errorContainer.style.overflowY = "auto";
	errorContainer.style.marginTop = "8px";

	for (const err of errors.slice(0, 10)) {
		const errorItem = document.createElement("div");
		errorItem.style.background = "#1f2937";
		errorItem.style.padding = "8px 12px";
		errorItem.style.borderRadius = "4px";
		errorItem.style.marginBottom = "4px";
		errorItem.style.fontFamily = "monospace";
		errorItem.style.fontSize = "11px";
		errorItem.style.color = "#f87171";
		errorItem.style.whiteSpace = "pre-wrap";
		errorItem.style.wordBreak = "break-all";
		errorItem.style.maxHeight = "80px";
		errorItem.style.overflow = "auto";
		errorItem.textContent = err;
		errorContainer.appendChild(errorItem);
	}
	section.appendChild(errorContainer);

	if (errors.length > 10) {
		const moreInfo = document.createElement("p");
		moreInfo.style.color = "#6b7280";
		moreInfo.style.fontSize = "12px";
		moreInfo.style.marginTop = "8px";
		moreInfo.textContent = `Showing first 10 of ${errors.length} errors`;
		section.appendChild(moreInfo);
	}

	return section;
}

function renderDeploymentList(
	titleText: string,
	items: string[] | undefined,
	listTag: "ol" | "ul",
): HTMLElement | null {
	if (!items || items.length === 0) {
		return null;
	}

	const section = document.createElement("div");
	section.className = "deployment-error__section";

	const title = document.createElement("h3");
	title.className = "deployment-error__section-title";
	title.textContent = titleText;
	section.appendChild(title);

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
				`#${ErrorDisplayId} .copy-errors-button`,
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
	icon.textContent = "🐾";
	content.appendChild(icon);

	const title = document.createElement("h2");
	title.className = "deployment-error__title";
	title.textContent = errorInfo.title;
	content.appendChild(title);

	const message = document.createElement("p");
	message.className = "deployment-error__message";
	message.textContent = errorInfo.message;
	content.appendChild(message);

	const diagnosticsEl = renderDiagnostics(diagnostics);
	if (diagnosticsEl) content.appendChild(diagnosticsEl);

	const consoleErrorsEl = renderConsoleErrors(consoleErrors);
	if (consoleErrorsEl) content.appendChild(consoleErrorsEl);

	const whatHappenedEl = renderDeploymentList("What happened", errorInfo.details, "ul");
	if (whatHappenedEl) content.appendChild(whatHappenedEl);

	const tryThisEl = renderDeploymentList("Try this", errorInfo.suggestions, "ol");
	if (tryThisEl) content.appendChild(tryThisEl);

	const buttonRow = document.createElement("div");
	buttonRow.className = "deployment-error__button-row";

	const tryAgainBtn = document.createElement("button");
	tryAgainBtn.type = "button";
	tryAgainBtn.className = "deployment-error__button";
	tryAgainBtn.textContent = "Try again";
	tryAgainBtn.addEventListener("click", () => window.location.reload());
	buttonRow.appendChild(tryAgainBtn);

	const dismissBtn = document.createElement("button");
	dismissBtn.type = "button";
	dismissBtn.className = "deployment-error__button";
	dismissBtn.style.background = "rgba(255,255,255,0.08)";
	dismissBtn.style.color = "#94a3b8";
	dismissBtn.textContent = "Dismiss";
	dismissBtn.addEventListener("click", () => {
		const display = document.getElementById(ErrorDisplayId);
		if (display) display.remove();
	});
	buttonRow.appendChild(dismissBtn);
	content.appendChild(buttonRow);

	const footer = document.createElement("p");
	footer.style.textAlign = "center";
	footer.style.color = "#475569";
	footer.style.fontSize = "11px";
	footer.style.marginTop = "16px";
	footer.textContent = "Open DevTools (F12) for more details";
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
				title: scriptLoaded ? "Something went wrong" : "Taking longer than expected",
				message: scriptLoaded
					? "The app loaded but couldn't start up. A few things that might explain it:"
					: "The app is taking a while to download or start. Possible reasons:",
				details: scriptLoaded
					? [
							"A JavaScript error stopped React from mounting",
							"A required environment variable is missing (e.g. VITE_SUPABASE_URL)",
							"An issue in the build or app code",
							"Review the Vite build output for warnings",
						]
					: [
							"Slow or blocked script downloads",
							"CDN or network hiccup",
							"The initial bundle is still on its way",
							"High server load during startup",
						],
				suggestions: scriptLoaded
					? [
							"Open DevTools (F12) and check the Console for errors",
							"Make sure all required environment variables are set",
							"Try a hard refresh (Ctrl+Shift+R / Cmd+Shift+R)",
							"Inspect the error boundary for more details",
							"Try a force rebuild if on CI/CD",
						]
					: [
							"Wait a few seconds and reload",
							"Check your network connection",
							"Open DevTools → Network to see if the bundle is stalled",
							"Check hosting logs for CDN or cold start issues",
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
