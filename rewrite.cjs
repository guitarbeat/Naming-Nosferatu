const fs = require('fs');

const path = 'src/app/deployment.ts';
let code = fs.readFileSync(path, 'utf-8');

// Replace the string-based HTML generation in showDeploymentError with DOM construction
const showDeploymentErrorRegex = /function showDeploymentError\(errorInfo: ErrorInfo\): void \{([\s\S]*?)(?=\nexport function initDeploymentCheck)/;
const newShowDeploymentError = `function showDeploymentError(errorInfo: ErrorInfo): void {
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
	if (diagSection) content.appendChild(diagSection);

	const consoleSection = renderConsoleErrors(consoleErrors);
	if (consoleSection) content.appendChild(consoleSection);

	const happenedSection = renderDeploymentList("What happened", errorInfo.details, "ul");
	if (happenedSection) content.appendChild(happenedSection);

	const tryThisSection = renderDeploymentList("Try this", errorInfo.suggestions, "ol");
	if (tryThisSection) content.appendChild(tryThisSection);

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
`;

code = code.replace(showDeploymentErrorRegex, newShowDeploymentError);

const renderDiagnosticsRegex = /function renderDiagnostics\(diagnostics: DiagnosticResult\[\]\): string \{([\s\S]*?)(?=\nfunction renderConsoleErrors)/;
const newRenderDiagnostics = `function renderDiagnostics(diagnostics: DiagnosticResult[]): HTMLElement | null {
	if (!diagnostics || diagnostics.length === 0) {
		return null;
	}

	const statusIcons: Record<string, string> = {
		ok: '✓',
		warning: '⚠',
		error: '✗',
		unknown: '?',
	};

    const statusColors: Record<string, string> = {
		ok: '#22c55e',
		warning: '#eab308',
		error: '#ef4444',
		unknown: '#6b7280',
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
        if (i === 1) th.style.textAlign = "center";
        th.textContent = text;
        trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    table.appendChild(thead);

	const tbody = document.createElement("tbody");
    diagnostics.forEach(d => {
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
`;
code = code.replace(renderDiagnosticsRegex, newRenderDiagnostics);

const renderConsoleErrorsRegex = /function renderConsoleErrors\(errors: string\[\]\): string \{([\s\S]*?)(?=\nfunction escapeHtml)/;
const newRenderConsoleErrors = `function renderConsoleErrors(errors: string[]): HTMLElement | null {
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
    titleSpan.textContent = \`Console Errors (\${errors.length})\`;
    title.appendChild(titleSpan);

    const btn = document.createElement("button");
    btn.type = "button";
    // We bind directly instead of using onclick HTML attribute
    btn.onclick = (window as any).copyErrorsToClipboard;
    btn.style.cssText = "margin-left:auto;padding:4px 12px;font-size:12px;background:#dc2626;color:white;border:none;border-radius:4px;cursor:pointer";
    btn.textContent = "Copy All";
    // Add id so copy function can find it
    btn.id = "copy-errors-btn";
    title.appendChild(btn);

    section.appendChild(title);

	const listContainer = document.createElement("div");
    listContainer.style.cssText = "max-height:200px;overflow-y:auto;margin-top:8px";

    errors.slice(0, 10).forEach(err => {
        const item = document.createElement("div");
        item.style.cssText = "background:#1f2937;padding:8px 12px;border-radius:4px;margin-bottom:4px;font-family:monospace;font-size:11px;color:#f87171;white-space:pre-wrap;word-break:break-all;max-height:80px;overflow:auto";
        item.textContent = err;
        listContainer.appendChild(item);
    });

    section.appendChild(listContainer);

    if (errors.length > 10) {
        const truncMsg = document.createElement("p");
        truncMsg.style.cssText = "color:#6b7280;font-size:12px;margin-top:8px";
        truncMsg.textContent = \`Showing first 10 of \${errors.length} errors\`;
        section.appendChild(truncMsg);
    }

	return section;
}
`;
code = code.replace(renderConsoleErrorsRegex, newRenderConsoleErrors);

const escapeHtmlRegex = /function escapeHtml[\s\S]*?\}\n\n/;
code = code.replace(escapeHtmlRegex, ""); // We don't need this anymore!


const renderDeploymentListRegex = /function renderDeploymentList\([\s\S]*?\): string \{([\s\S]*?)(?=\n\/\/ Expose copy function)/;
const newRenderDeploymentList = `function renderDeploymentList(
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

    items.forEach(itemText => {
        const li = document.createElement("li");
        li.className = "deployment-error__list-item";
        li.textContent = itemText;
        list.appendChild(li);
    });

    section.appendChild(list);
    return section;
}
`;
code = code.replace(renderDeploymentListRegex, newRenderDeploymentList);

const copyBtnRegex = /document\.querySelector\(\s*\'#deployment-error-display button\[onclick="copyErrorsToClipboard\(\)"\]\',\s*\)/;
code = code.replace(copyBtnRegex, "document.getElementById('copy-errors-btn')");

fs.writeFileSync(path, code);
