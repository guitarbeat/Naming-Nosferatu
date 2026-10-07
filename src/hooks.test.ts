// @vitest-environment happy-dom
// @ts-nocheck
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	type UseIntersectionObserverOptions,
	useDebounce,
	useIntersectionObserver,
} from "./hooks";

type ObserverCallback = (
	entries: IntersectionObserverEntry[],
	observer: IntersectionObserver,
) => void;

class MockIntersectionObserver implements IntersectionObserver {
	readonly root: Element | Document | null;
	readonly rootMargin: string;
	readonly thresholds: ReadonlyArray<number>;
	callback: ObserverCallback;
	observedElements = new Set<Element>();
	disconnected = false;

	static instances: MockIntersectionObserver[] = [];

	constructor(callback: ObserverCallback, options?: IntersectionObserverInit) {
		this.callback = callback;
		this.root = options?.root ?? null;
		this.rootMargin = options?.rootMargin ?? "0px";
		const threshold = options?.threshold ?? 0;
		this.thresholds = Array.isArray(threshold) ? threshold : [threshold];
		MockIntersectionObserver.instances.push(this);
	}

	observe(target: Element): void {
		this.observedElements.add(target);
	}

	unobserve(target: Element): void {
		this.observedElements.delete(target);
	}

	disconnect(): void {
		this.disconnected = true;
		this.observedElements.clear();
	}

	takeRecords(): IntersectionObserverEntry[] {
		return [];
	}

	triggerIntersection(target: Element, isIntersecting: boolean): void {
		const entry: Partial<IntersectionObserverEntry> = {
			target,
			isIntersecting,
			intersectionRatio: isIntersecting ? 1 : 0,
			boundingClientRect: target.getBoundingClientRect(),
			intersectionRect: target.getBoundingClientRect(),
			rootBounds: null,
			time: Date.now(),
		};
		this.callback([entry as IntersectionObserverEntry], this);
	}
}

describe("useIntersectionObserver", () => {
	let container: HTMLDivElement | null = null;
	let root: Root | null = null;
	const originalIntersectionObserver = window.IntersectionObserver;

	beforeEach(() => {
		MockIntersectionObserver.instances = [];
		// @ts-expect-error Mocking global IntersectionObserver
		window.IntersectionObserver = MockIntersectionObserver;
		container = document.createElement("div");
		document.body.appendChild(container);
		root = createRoot(container);
	});

	afterEach(() => {
		if (root) {
			act(() => {
				root?.unmount();
			});
			root = null;
		}
		if (container) {
			container.remove();
			container = null;
		}
		window.IntersectionObserver = originalIntersectionObserver;
	});

	function renderTestComponent(
		options?: UseIntersectionObserverOptions,
		attachRef = true,
	) {
		let currentVisibility: boolean | undefined;
		let divRefElement: HTMLDivElement | null = null;

		function TestComponent() {
			const ref = React.useRef<HTMLDivElement>(null);
			const isVisible = useIntersectionObserver(ref, options);

			React.useEffect(() => {
				if (ref.current) {
					divRefElement = ref.current;
				}
			});

			currentVisibility = isVisible;
			return React.createElement(
				"div",
				{ ref: attachRef ? ref : null },
				"Test Content",
			);
		}

		act(() => {
			root?.render(React.createElement(TestComponent));
		});

		return {
			getVisibility: () => currentVisibility,
			getDivRef: () => divRefElement,
		};
	}

	it("returns true when enabled is false", () => {
		const { getVisibility } = renderTestComponent({
			enabled: false,
			initialIsVisible: false,
		});
		expect(getVisibility()).toBe(true);
		expect(MockIntersectionObserver.instances.length).toBe(0);
	});

	it("returns true when targetRef.current is null", () => {
		const { getVisibility } = renderTestComponent({ enabled: true }, false);
		expect(getVisibility()).toBe(true);
		expect(MockIntersectionObserver.instances.length).toBe(0);
	});

	it("returns true when IntersectionObserver is not in window", () => {
		// biome-ignore lint/performance/noDelete: deleting property from window to simulate missing API in browser
		delete window.IntersectionObserver;
		const { getVisibility } = renderTestComponent({ enabled: true });
		expect(getVisibility()).toBe(true);
	});

	it("respects initialIsVisible when enabled is true", () => {
		const { getVisibility } = renderTestComponent({
			enabled: true,
			initialIsVisible: false,
		});
		expect(getVisibility()).toBe(false);
	});

	it("updates visibility state when intersection changes", () => {
		const { getVisibility, getDivRef } = renderTestComponent({
			enabled: true,
			initialIsVisible: true,
		});

		expect(getVisibility()).toBe(true);
		expect(MockIntersectionObserver.instances.length).toBe(1);

		const observer = MockIntersectionObserver.instances[0];
		const targetElement = getDivRef();
		expect(targetElement).not.toBeNull();
		if (!targetElement) {
			throw new Error("Target element should not be null");
		}
		expect(observer.observedElements.has(targetElement)).toBe(true);

		// Trigger element leaving viewport
		act(() => {
			observer.triggerIntersection(targetElement, false);
		});
		expect(getVisibility()).toBe(false);

		// Trigger element entering viewport
		act(() => {
			observer.triggerIntersection(targetElement, true);
		});
		expect(getVisibility()).toBe(true);
	});

	it("pools observer instances with matching options", () => {
		let visibility1: boolean | undefined;
		let visibility2: boolean | undefined;

		function DualComponent() {
			const ref1 = React.useRef<HTMLDivElement>(null);
			const ref2 = React.useRef<HTMLDivElement>(null);

			const options = { rootMargin: "100px", threshold: 0.5 };
			visibility1 = useIntersectionObserver(ref1, options);
			visibility2 = useIntersectionObserver(ref2, options);

			return React.createElement(
				"div",
				null,
				React.createElement("div", { ref: ref1 }, "First"),
				React.createElement("div", { ref: ref2 }, "Second"),
			);
		}

		act(() => {
			root?.render(React.createElement(DualComponent));
		});

		// Should reuse a single observer instance for both hooks
		expect(MockIntersectionObserver.instances.length).toBe(1);
		const observer = MockIntersectionObserver.instances[0];
		expect(observer.observedElements.size).toBe(2);

		expect(visibility1).toBeDefined();
		expect(visibility2).toBeDefined();
	});

	it("cleans up observer and disconnects when all targets unmount", () => {
		renderTestComponent({ rootMargin: "50px" });

		expect(MockIntersectionObserver.instances.length).toBe(1);
		const observer = MockIntersectionObserver.instances[0];

		// Unmount component
		act(() => {
			root?.unmount();
			root = null;
		});

		expect(observer.disconnected).toBe(true);
		expect(observer.observedElements.size).toBe(0);
	});

	it("supports array thresholds and generates correct pool keys", () => {
		renderTestComponent({ threshold: [0, 0.5, 1] });

		expect(MockIntersectionObserver.instances.length).toBe(1);
		const observer = MockIntersectionObserver.instances[0];
		expect(observer.thresholds).toEqual([0, 0.5, 1]);
	});

	it("supports custom root element", () => {
		const customRoot = document.createElement("div");
		document.body.appendChild(customRoot);

		renderTestComponent({ root: customRoot });

		expect(MockIntersectionObserver.instances.length).toBe(1);
		const observer = MockIntersectionObserver.instances[0];
		expect(observer.root).toBe(customRoot);

		customRoot.remove();
	});

	it("handles dynamic toggling of enabled option", () => {
		let setEnabledFn: (val: boolean) => void;

		function DynamicEnabledComponent() {
			const ref = React.useRef<HTMLDivElement>(null);
			const [enabled, setEnabled] = React.useState(false);
			setEnabledFn = setEnabled;
			const isVisible = useIntersectionObserver(ref, {
				enabled,
				initialIsVisible: false,
			});
			return React.createElement(
				"div",
				{ ref },
				isVisible ? "Visible" : "Hidden",
			);
		}

		act(() => {
			root?.render(React.createElement(DynamicEnabledComponent));
		});

		// Disabled initially -> defaults isVisible to true
		expect(container?.textContent).toBe("Visible");
		expect(MockIntersectionObserver.instances.length).toBe(0);

		// Enable observation
		act(() => {
			setEnabledFn(true);
		});

		expect(MockIntersectionObserver.instances.length).toBe(1);
		const observer = MockIntersectionObserver.instances[0];
		const targetElement = container?.querySelector("div");
		expect(targetElement).not.toBeNull();

		// Trigger intersection as false
		act(() => {
			observer.triggerIntersection(targetElement as Element, false);
		});
		expect(container?.textContent).toBe("Hidden");

		// Disable observation again
		act(() => {
			setEnabledFn(false);
		});
		expect(container?.textContent).toBe("Visible");
	});

	it("re-subscribes when options change", () => {
		let setRootMarginFn: (margin: string) => void;

		function DynamicOptionsComponent() {
			const ref = React.useRef<HTMLDivElement>(null);
			const [rootMargin, setRootMargin] = React.useState("10px");
			setRootMarginFn = setRootMargin;
			useIntersectionObserver(ref, { rootMargin });
			return React.createElement("div", { ref }, "Content");
		}

		act(() => {
			root?.render(React.createElement(DynamicOptionsComponent));
		});

		expect(MockIntersectionObserver.instances.length).toBe(1);
		expect(MockIntersectionObserver.instances[0].rootMargin).toBe("10px");

		// Change option
		act(() => {
			setRootMarginFn("50px");
		});

		expect(MockIntersectionObserver.instances.length).toBe(2);
		expect(MockIntersectionObserver.instances[1].rootMargin).toBe("50px");
		// Old observer instance should be disconnected
		expect(MockIntersectionObserver.instances[0].disconnected).toBe(true);
	});

	it("handles partial unmounting of elements sharing a pooled observer", () => {
		let setShowSecondFn: (show: boolean) => void;
		const options = { rootMargin: "20px" };

		function ObserverChild({ label }: { label: string }) {
			const ref = React.useRef<HTMLDivElement>(null);
			useIntersectionObserver(ref, options);
			return React.createElement("div", { ref }, label);
		}

		function SharedObserverComponent() {
			const [showSecond, setShowSecond] = React.useState(true);
			setShowSecondFn = setShowSecond;

			return React.createElement(
				"div",
				null,
				React.createElement(ObserverChild, { label: "First" }),
				showSecond
					? React.createElement(ObserverChild, { label: "Second" })
					: null,
			);
		}

		act(() => {
			root?.render(React.createElement(SharedObserverComponent));
		});

		expect(MockIntersectionObserver.instances.length).toBe(1);
		const observer = MockIntersectionObserver.instances[0];
		expect(observer.observedElements.size).toBe(2);
		expect(observer.disconnected).toBe(false);

		// Hide second element (unmounts second ObserverChild component)
		act(() => {
			setShowSecondFn(false);
		});

		// Observer should still be active for element 1, not disconnected
		expect(observer.observedElements.size).toBe(1);
		expect(observer.disconnected).toBe(false);

		// Unmount root completely
		act(() => {
			root?.unmount();
			root = null;
		});

		// Now observer disconnects
		expect(observer.disconnected).toBe(true);
		expect(observer.observedElements.size).toBe(0);
	});
});

describe("useDebounce", () => {
	let container: HTMLDivElement | null = null;
	let root: Root | null = null;

	beforeEach(() => {
		vi.useFakeTimers();
		container = document.createElement("div");
		document.body.appendChild(container);
		root = createRoot(container);
	});

	afterEach(() => {
		if (root) {
			act(() => {
				root?.unmount();
			});
			root = null;
		}
		if (container) {
			container.remove();
			container = null;
		}
		vi.useRealTimers();
	});

	function renderDebounceHook<T>(initialValue: T, delay: number) {
		let latestDebouncedValue: T;

		function TestComponent({ val, del }: { val: T; del: number }) {
			const debounced = useDebounce(val, del);
			latestDebouncedValue = debounced;
			return React.createElement("div", null, String(debounced));
		}

		act(() => {
			root?.render(
				React.createElement(TestComponent, { val: initialValue, del: delay }),
			);
		});

		return {
			getValue: () => latestDebouncedValue,
			update: (newValue: T, newDelay: number = delay) => {
				act(() => {
					root?.render(
						React.createElement(TestComponent, {
							val: newValue,
							del: newDelay,
						}),
					);
				});
			},
		};
	}

	it("returns initial value immediately on mount", () => {
		const { getValue } = renderDebounceHook("hello", 500);
		expect(getValue()).toBe("hello");
	});

	it("delays updating the value until delay has elapsed", () => {
		const { getValue, update } = renderDebounceHook("initial", 500);

		update("updated");
		expect(getValue()).toBe("initial");

		act(() => {
			vi.advanceTimersByTime(499);
		});
		expect(getValue()).toBe("initial");

		act(() => {
			vi.advanceTimersByTime(1);
		});
		expect(getValue()).toBe("updated");
	});

	it("resets timer when value changes rapidly", () => {
		const { getValue, update } = renderDebounceHook("first", 500);

		update("second");
		act(() => {
			vi.advanceTimersByTime(300);
		});
		expect(getValue()).toBe("first");

		update("third");
		act(() => {
			vi.advanceTimersByTime(300);
		});
		expect(getValue()).toBe("first");

		act(() => {
			vi.advanceTimersByTime(200);
		});
		expect(getValue()).toBe("third");
	});

	it("handles delay parameter updates", () => {
		const { getValue, update } = renderDebounceHook("initial", 500);

		update("updated", 1000);
		act(() => {
			vi.advanceTimersByTime(500);
		});
		expect(getValue()).toBe("initial");

		act(() => {
			vi.advanceTimersByTime(500);
		});
		expect(getValue()).toBe("updated");
	});

	it("clears timeout on unmount", () => {
		const { getValue, update } = renderDebounceHook("initial", 500);
		update("updated");

		act(() => {
			root?.unmount();
			root = null;
		});

		act(() => {
			vi.advanceTimersByTime(500);
		});
		expect(getValue()).toBe("initial");
	});
});
