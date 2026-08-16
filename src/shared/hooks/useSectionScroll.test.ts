import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { useSectionScroll } from "./useSectionScroll";
import { usePrefersReducedMotion } from "@/shared/hooks/usePrefersReducedMotion";

// @vitest-environment jsdom

vi.mock("@/shared/hooks/usePrefersReducedMotion", () => ({
	usePrefersReducedMotion: vi.fn(),
}));

describe("useSectionScroll", () => {
	let mockScrollIntoView;
	let mockGetElementById;

	beforeEach(() => {
		vi.useFakeTimers();

		mockScrollIntoView = vi.fn();
		mockGetElementById = vi.fn().mockImplementation((id) => {
			if (id === "missing-element") return null;
			return {
				scrollIntoView: mockScrollIntoView,
			};
		});

		vi.spyOn(document, 'getElementById').mockImplementation(mockGetElementById);
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	describe("scrollToSection", () => {
		it("should scroll with smooth behavior when prefersReducedMotion is false", () => {
			vi.mocked(usePrefersReducedMotion).mockReturnValue(false);

			const { result } = renderHook(() => useSectionScroll());

			act(() => {
				result.current.scrollToSection("test-section");
			});

			expect(document.getElementById).toHaveBeenCalledWith("test-section");
			expect(mockScrollIntoView).toHaveBeenCalledWith({
				behavior: "smooth",
				block: "start",
			});
		});

		it("should scroll with auto behavior when prefersReducedMotion is true", () => {
			vi.mocked(usePrefersReducedMotion).mockReturnValue(true);

			const { result } = renderHook(() => useSectionScroll());

			act(() => {
				result.current.scrollToSection("test-section");
			});

			expect(document.getElementById).toHaveBeenCalledWith("test-section");
			expect(mockScrollIntoView).toHaveBeenCalledWith({
				behavior: "auto",
				block: "start",
			});
		});

		it("should handle missing elements gracefully", () => {
			vi.mocked(usePrefersReducedMotion).mockReturnValue(false);

			const { result } = renderHook(() => useSectionScroll());

			act(() => {
				result.current.scrollToSection("missing-element");
			});

			expect(document.getElementById).toHaveBeenCalledWith("missing-element");
			expect(mockScrollIntoView).not.toHaveBeenCalled();
		});

		it("should clear any pending scroll when scrollToSection is called", () => {
			vi.mocked(usePrefersReducedMotion).mockReturnValue(false);
			const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

			const { result } = renderHook(() => useSectionScroll());

			act(() => {
				result.current.scheduleSectionScroll("delayed-section", 1000);
			});

			act(() => {
				result.current.scrollToSection("immediate-section");
			});

			expect(clearTimeoutSpy).toHaveBeenCalled();
			expect(document.getElementById).toHaveBeenCalledWith("immediate-section");

			// The delayed scroll should not happen
			act(() => {
				vi.advanceTimersByTime(1000);
			});
			expect(document.getElementById).not.toHaveBeenCalledWith("delayed-section");
		});
	});

	describe("scheduleSectionScroll", () => {
		it("should schedule a scroll after the specified delay", () => {
			vi.mocked(usePrefersReducedMotion).mockReturnValue(false);

			const { result } = renderHook(() => useSectionScroll());

			act(() => {
				result.current.scheduleSectionScroll("test-section", 500);
			});

			expect(document.getElementById).not.toHaveBeenCalled();

			act(() => {
				vi.advanceTimersByTime(499);
			});
			expect(document.getElementById).not.toHaveBeenCalled();

			act(() => {
				vi.advanceTimersByTime(1);
			});

			expect(document.getElementById).toHaveBeenCalledWith("test-section");
			expect(mockScrollIntoView).toHaveBeenCalledWith({
				behavior: "smooth",
				block: "start",
			});
		});

		it("should use default delay of 800ms if not specified", () => {
			vi.mocked(usePrefersReducedMotion).mockReturnValue(false);

			const { result } = renderHook(() => useSectionScroll());

			act(() => {
				result.current.scheduleSectionScroll("test-section");
			});

			act(() => {
				vi.advanceTimersByTime(799);
			});
			expect(document.getElementById).not.toHaveBeenCalled();

			act(() => {
				vi.advanceTimersByTime(1);
			});
			expect(document.getElementById).toHaveBeenCalledWith("test-section");
		});

		it("should clear previous pending scroll when called multiple times", () => {
			vi.mocked(usePrefersReducedMotion).mockReturnValue(false);
			const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

			const { result } = renderHook(() => useSectionScroll());

			act(() => {
				result.current.scheduleSectionScroll("first-section", 500);
			});

			act(() => {
				result.current.scheduleSectionScroll("second-section", 500);
			});

			expect(clearTimeoutSpy).toHaveBeenCalled();

			act(() => {
				vi.advanceTimersByTime(500);
			});

			expect(document.getElementById).not.toHaveBeenCalledWith("first-section");
			expect(document.getElementById).toHaveBeenCalledWith("second-section");
		});
	});

	describe("clearPendingScroll", () => {
		it("should clear the active timeout", () => {
			vi.mocked(usePrefersReducedMotion).mockReturnValue(false);
			const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

			const { result } = renderHook(() => useSectionScroll());

			act(() => {
				result.current.scheduleSectionScroll("test-section", 500);
			});

			act(() => {
				result.current.clearPendingScroll();
			});

			expect(clearTimeoutSpy).toHaveBeenCalled();

			act(() => {
				vi.advanceTimersByTime(500);
			});

			expect(document.getElementById).not.toHaveBeenCalled();
		});

		it("should do nothing if there is no pending scroll", () => {
			vi.mocked(usePrefersReducedMotion).mockReturnValue(false);
			const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

			const { result } = renderHook(() => useSectionScroll());

			act(() => {
				result.current.clearPendingScroll();
			});

			expect(clearTimeoutSpy).not.toHaveBeenCalled();
		});
	});
});
