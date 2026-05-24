process.env.JWT_SECRET = "test-secret";
import React from "react";
globalThis.React = React;

// Delete native globalThis.localStorage in Node 26+ to prevent conflicts with jsdom
try {
	// @ts-expect-error - native localStorage is configurable
	delete globalThis.localStorage;
} catch {
	// Ignore if not deletable
}

// Mock localStorage for Node 26+ and jsdom environments
if (typeof window !== "undefined" && window.localStorage) {
	Object.defineProperty(globalThis, "localStorage", {
		value: window.localStorage,
		writable: true,
		configurable: true,
	});
	if (window.Storage) {
		globalThis.Storage = window.Storage;
		
		const originalSetItem = window.Storage.prototype.setItem;
		const originalGetItem = window.Storage.prototype.getItem;
		const originalRemoveItem = window.Storage.prototype.removeItem;
		const originalClear = window.Storage.prototype.clear;

		// Force localStorage to delegate directly to Storage.prototype so spies work!
		window.localStorage.setItem = function (key, value) {
			return (window.Storage.prototype.setItem || originalSetItem).call(this, key, value);
		};
		window.localStorage.getItem = function (key) {
			return (window.Storage.prototype.getItem || originalGetItem).call(this, key);
		};
		window.localStorage.removeItem = function (key) {
			return (window.Storage.prototype.removeItem || originalRemoveItem).call(this, key);
		};
		window.localStorage.clear = function () {
			return (window.Storage.prototype.clear || originalClear).call(this);
		};
	}
} else {
	// Fallback mock if window.localStorage is missing
	class LocalStorageMock {
		private store: Record<string, string> = {};
		clear() { this.store = {}; }
		getItem(key: string): string | null { return this.store[key] || null; }
		setItem(key: string, value: string) { this.store[key] = String(value); }
		removeItem(key: string) { delete this.store[key]; }
		key(index: number): string | null { return Object.keys(this.store)[index] || null; }
		get length(): number { return Object.keys(this.store).length; }
	}
	const localStorageInstance = new LocalStorageMock();
	Object.defineProperty(globalThis, "localStorage", {
		value: localStorageInstance,
		writable: true,
		configurable: true,
	});
}

if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
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
