process.env.JWT_SECRET = "test-secret";
import React from "react";
globalThis.React = React;

if (typeof window.matchMedia !== "function") {
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: (query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: () => {},
			removeListener: () => {},
			addEventListener: () => {},
			removeEventListener: () => {},
			dispatchEvent: () => false,
		}),
	});
}

if (typeof CSS === "undefined" || typeof CSS.supports !== "function") {
	Object.defineProperty(globalThis, "CSS", {
		writable: true,
		value: {
			...(typeof CSS !== "undefined" ? CSS : {}),
			supports: () => false,
		},
	});
}
