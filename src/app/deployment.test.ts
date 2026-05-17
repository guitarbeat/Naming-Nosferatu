import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initDeploymentCheck } from "./deployment";

describe("deployment check", () => {
	let originalConsoleError: typeof console.error;
	let originalNav: any;

	beforeEach(() => {
		// Save original implementations
		originalConsoleError = console.error;
		originalNav = navigator;

		// Reset body
		document.body.innerHTML = "";

		// Mock console.error
		console.error = vi.fn();

		// Setup a basic DOM layout
		const root = document.createElement("div");
		root.id = "root";
		document.body.appendChild(root);

		// Mock navigator.onLine since some diagnostics check it
		Object.defineProperty(window, "navigator", {
			value: { ...navigator, onLine: true },
			writable: true,
		});
	});

	afterEach(() => {
		// Restore implementations
		console.error = originalConsoleError;
		Object.defineProperty(window, "navigator", {
			value: originalNav,
			writable: true,
		});

		// Clear DOM and any left over intervals/timeouts
		document.body.innerHTML = "";
		vi.restoreAllMocks();
	});

	it("shows error overlay when root element is missing", () => {
		// Remove root
		document.body.innerHTML = "";

		initDeploymentCheck();

		const errorDisplay = document.getElementById("deployment-error-display");
		expect(errorDisplay).not.toBeNull();
		expect(errorDisplay?.textContent).toContain("Root Element Missing");
	});

	it("shows error overlay when script load fails", () => {
		const root = document.getElementById("root");
		expect(root).not.toBeNull();

		// Create a module script to trigger the check
		const script = document.createElement("script");
		script.type = "module";
		script.src = "/assets/index.js";
		document.body.appendChild(script);

		initDeploymentCheck();

		// Simulate script load error
		script.dispatchEvent(new Event("error"));

		const errorDisplay = document.getElementById("deployment-error-display");
		expect(errorDisplay).not.toBeNull();
		expect(errorDisplay?.textContent).toContain("JavaScript Failed to Load");
	});

	it("shows error overlay for CSP violations blocking scripts", () => {
		initDeploymentCheck();

		// jsdom doesn't have SecurityPolicyViolationEvent, so mock the Event interface
		class MockSecurityPolicyViolationEvent extends Event {
			violatedDirective: string;
			effectiveDirective: string;
			blockedURI: string;
			originalPolicy: string;

			constructor(type: string, init: any) {
				super(type);
				this.violatedDirective = init.violatedDirective;
				this.effectiveDirective = init.effectiveDirective;
				this.blockedURI = init.blockedURI;
				this.originalPolicy = init.originalPolicy;
			}
		}

		const event = new MockSecurityPolicyViolationEvent("securitypolicyviolation", {
			violatedDirective: "script-src",
			effectiveDirective: "script-src",
			blockedURI: "https://example.com/script.js",
			originalPolicy: "default-src 'self'",
		});

		document.dispatchEvent(event);

		const errorDisplay = document.getElementById("deployment-error-display");
		expect(errorDisplay).not.toBeNull();
		expect(errorDisplay?.textContent).toContain("Content Security Policy Violation");
	});

	it("does not show error overlay initially if root exists and no errors occur", () => {
		initDeploymentCheck();
		const errorDisplay = document.getElementById("deployment-error-display");
		expect(errorDisplay).toBeNull();
	});
});
