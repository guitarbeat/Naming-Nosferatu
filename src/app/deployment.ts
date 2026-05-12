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

	const statusIcons: Record<string, string> = {
		ok: "✓",
		warning: "⚠",
		error: "✗",
		unknown: "?",
	};

	const statusColors: Record<string, string> = {
		ok: "#22c55e",
		warning: "#eab308",
		error: "#ef4444",
		unknown: "#6b7280",
	};

	const section = document.createElement("div");
	section.className = "deployment-error__section";
	section.style.cssText = "background:#fafafa;border-left-color:#3b82f6";

	const title = document.createElement("h3");
	title.className = "deployment-error__section-title";
	title.style.cssText = "display:flex;align-items:center;gap:8px";

	const titleSpan = document.createElement("span");
	titleSpan.style.fontSize = "16px";
	titleSpan.textContent = "Diagnostics";
	title.appendChild(titleSpan);
	section.appendChild(title);

	const table = document.createElement("table");
	table.style.cssText = "width:100%;border-collapse:collapse;font-size:14px;margin-top:8px";

	const thead = document.createElement("thead");
	const trHead = document.createElement("tr");
	trHead.style.cssText = "background:#f3f4f6;text-align:left";
	["Check", "Status", "Value", "Hint"].forEach((text, i) => {
		const th = document.createElement("th");
		th.style.padding = "8px 12px";
		if (i === 1) {
			th.style.textAlign = "center";
		}
		th.textContent = text;
		trHead.appendChild(th);
	});
	thead.appendChild(trHead);
	table.appendChild(thead);

	const tbody = document.createElement("tbody");
	diagnostics.forEach((d) => {
		const tr = document.createElement("tr");
		tr.style.borderBottom = "1px solid #e5e7eb";

		const tdName = document.createElement("td");
		tdName.style.cssText = "padding:8px 12px;font-weight:500";
		tdName.textContent = d.name;
		tr.appendChild(tdName);

		const tdStatus = document.createElement("td");
		tdStatus.style.cssText = "padding:8px 12px;text-align:center";
		const statusSpan = document.createElement("span");
		statusSpan.style.color = statusColors[d.status];
		statusSpan.textContent = statusIcons[d.status];
		tdStatus.appendChild(statusSpan);
		tr.appendChild(tdStatus);

		const tdValue = document.createElement("td");
		tdValue.style.cssText = "padding:8px 12px;font-family:monospace;font-size:12px";
		tdValue.textContent = d.value || "-";
		tr.appendChild(tdValue);

		const tdHint = document.createElement("td");
		tdHint.style.cssText = "padding:8px 12px;color:#6b7280;font-size:12px";
		tdHint.textContent = d.hint || "";
		tr.appendChild(tdHint);

		tbody.appendChild(tr);
	});

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
	section.style.cssText = "background:#fef2f2;border-left-color:#ef4444";

	const title = document.createElement("h3");
	title.className = "deployment-error__section-title";
	title.style.cssText = "color:#dc2626;display:flex;align-items:center;justify-content:between";

	const titleSpan = document.createElement("span");
	titleSpan.textContent = `Console Errors (${errors.length})`;
	title.appendChild(titleSpan);

	const btn = document.createElement("button");
	btn.type = "button";
	// We bind directly instead of using onclick HTML attribute
	btn.onclick = (window as any).copyErrorsToClipboard;
	btn.style.cssText =
		"margin-left:auto;padding:4px 12px;font-size:12px;background:#dc2626;color:white;border:none;border-radius:4px;cursor:pointer";
	btn.textContent = "Copy All";
	// Add id so copy function can find it
	btn.id = "copy-errors-btn";
	title.appendChild(btn);

	section.appendChild(title);

	const listContainer = document.createElement("div");
	listContainer.style.cssText = "max-height:200px;overflow-y:auto;margin-top:8px";

	errors.slice(0, 10).forEach((err) => {
		const item = document.createElement("div");
		item.style.cssText =
			"background:#1f2937;padding:8px 12px;border-radius:4px;margin-bottom:4px;font-family:monospace;font-size:11px;color:#f87171;white-space:pre-wrap;word-break:break-all;max-height:80px;overflow:auto";
		item.textContent = err;
		listContainer.appendChild(item);
	});

	section.appendChild(listContainer);

	if (errors.length > 10) {
		const truncMsg = document.createElement("p");
		truncMsg.style.cssText = "color:#6b7280;font-size:12px;margin-top:8px";
		truncMsg.textContent = `Showing first 10 of ${errors.length} errors`;
		section.appendChild(truncMsg);
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

	items.forEach((itemText) => {
		const li = document.createElement("li");
		li.className = "deployment-error__list-item";
		li.textContent = itemText;
		list.appendChild(li);
	});

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
			const btn = document.getElementById("copy-errors-btn") as HTMLButtonElement;
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

	const diagSection = renderDiagnostics(diagnostics);
	if (diagSection) {
		content.appendChild(diagSection);
	}

	const consoleSection = renderConsoleErrors(consoleErrors);
	if (consoleSection) {
		content.appendChild(consoleSection);
	}

	const happenedSection = renderDeploymentList("What happened", errorInfo.details, "ul");
	if (happenedSection) {
		content.appendChild(happenedSection);
	}

	const tryThisSection = renderDeploymentList("Try this", errorInfo.suggestions, "ol");
	if (tryThisSection) {
		content.appendChild(tryThisSection);
	}

	const buttonRow = document.createElement("div");
	buttonRow.className = "deployment-error__button-row";

	const retryBtn = document.createElement("button");
	retryBtn.type = "button";
	retryBtn.className = "deployment-error__button";
	retryBtn.textContent = "Try again";
	retryBtn.onclick = () => window.location.reload();
	buttonRow.appendChild(retryBtn);

	const dismissBtn = document.createElement("button");
	dismissBtn.type = "button";
	dismissBtn.className = "deployment-error__button";
	dismissBtn.style.cssText = "background:rgba(255,255,255,0.08);color:#94a3b8";
	dismissBtn.textContent = "Dismiss";
	dismissBtn.onclick = () => document.getElementById(ErrorDisplayId)?.remove();
	buttonRow.appendChild(dismissBtn);

	content.appendChild(buttonRow);

	const footer = document.createElement("p");
	footer.style.cssText = "text-align:center;color:#475569;font-size:11px;margin-top:16px";
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
