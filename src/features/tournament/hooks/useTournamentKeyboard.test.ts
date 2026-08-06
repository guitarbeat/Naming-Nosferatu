import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTournamentKeyboard } from "./useTournamentKeyboard";
import type React from "react";

describe("useTournamentKeyboard", () => {
	const mockOnVoteForSide = vi.fn();
	const mockOnUndo = vi.fn();
	const mockOnQuit = vi.fn();

	const defaultOptions = {
		onVoteForSide: mockOnVoteForSide,
		onUndo: mockOnUndo,
		onQuit: mockOnQuit,
		canUndo: true,
		isVoting: false,
		isOpeningReveal: false,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("handleKeyDown (element level)", () => {
		it("calls onVoteForSide and prevents default on Enter", () => {
			const { result } = renderHook(() => useTournamentKeyboard(defaultOptions));
			const event = { key: "Enter", preventDefault: vi.fn() } as unknown as React.KeyboardEvent<HTMLElement>;

			result.current.handleKeyDown(event, "left");

			expect(event.preventDefault).toHaveBeenCalled();
			expect(mockOnVoteForSide).toHaveBeenCalledWith("left");
		});

		it("calls onVoteForSide and prevents default on Space", () => {
			const { result } = renderHook(() => useTournamentKeyboard(defaultOptions));
			const event = { key: " ", preventDefault: vi.fn() } as unknown as React.KeyboardEvent<HTMLElement>;

			result.current.handleKeyDown(event, "right");

			expect(event.preventDefault).toHaveBeenCalled();
			expect(mockOnVoteForSide).toHaveBeenCalledWith("right");
		});

		it("ignores other keys", () => {
			const { result } = renderHook(() => useTournamentKeyboard(defaultOptions));
			const event = { key: "a", preventDefault: vi.fn() } as unknown as React.KeyboardEvent<HTMLElement>;

			result.current.handleKeyDown(event, "left");

			expect(event.preventDefault).not.toHaveBeenCalled();
			expect(mockOnVoteForSide).not.toHaveBeenCalled();
		});
	});

	describe("handleGlobalKeyDown (window level)", () => {
		const createGlobalEvent = (key: string, target?: Partial<HTMLElement>) => {
			return {
				key,
				preventDefault: vi.fn(),
				target: target || document.createElement("div"),
			} as unknown as globalThis.KeyboardEvent;
		};

		it("calls onVoteForSide('left') on '1'", () => {
			const { result } = renderHook(() => useTournamentKeyboard(defaultOptions));
			const event = createGlobalEvent("1");

			result.current.handleGlobalKeyDown(event);

			expect(event.preventDefault).toHaveBeenCalled();
			expect(mockOnVoteForSide).toHaveBeenCalledWith("left");
		});

		it("calls onVoteForSide('left') on 'ArrowLeft'", () => {
			const { result } = renderHook(() => useTournamentKeyboard(defaultOptions));
			const event = createGlobalEvent("ArrowLeft");

			result.current.handleGlobalKeyDown(event);

			expect(event.preventDefault).toHaveBeenCalled();
			expect(mockOnVoteForSide).toHaveBeenCalledWith("left");
		});

		it("calls onVoteForSide('right') on '2'", () => {
			const { result } = renderHook(() => useTournamentKeyboard(defaultOptions));
			const event = createGlobalEvent("2");

			result.current.handleGlobalKeyDown(event);

			expect(event.preventDefault).toHaveBeenCalled();
			expect(mockOnVoteForSide).toHaveBeenCalledWith("right");
		});

		it("calls onVoteForSide('right') on 'ArrowRight'", () => {
			const { result } = renderHook(() => useTournamentKeyboard(defaultOptions));
			const event = createGlobalEvent("ArrowRight");

			result.current.handleGlobalKeyDown(event);

			expect(event.preventDefault).toHaveBeenCalled();
			expect(mockOnVoteForSide).toHaveBeenCalledWith("right");
		});

		it("calls onUndo on 'u' when canUndo is true", () => {
			const { result } = renderHook(() => useTournamentKeyboard(defaultOptions));
			const event = createGlobalEvent("u");

			result.current.handleGlobalKeyDown(event);

			expect(event.preventDefault).toHaveBeenCalled();
			expect(mockOnUndo).toHaveBeenCalled();
		});

		it("does not call onUndo on 'u' when canUndo is false", () => {
			const { result } = renderHook(() =>
				useTournamentKeyboard({ ...defaultOptions, canUndo: false }),
			);
			const event = createGlobalEvent("u");

			result.current.handleGlobalKeyDown(event);

			expect(event.preventDefault).not.toHaveBeenCalled();
			expect(mockOnUndo).not.toHaveBeenCalled();
		});

		it("calls onQuit on 'q'", () => {
			const { result } = renderHook(() => useTournamentKeyboard(defaultOptions));
			const event = createGlobalEvent("q");

			result.current.handleGlobalKeyDown(event);

			expect(event.preventDefault).toHaveBeenCalled();
			expect(mockOnQuit).toHaveBeenCalled();
		});

		it("handles upper case keys correctly", () => {
			const { result } = renderHook(() => useTournamentKeyboard(defaultOptions));
			const event = createGlobalEvent("Q");

			result.current.handleGlobalKeyDown(event);

			expect(event.preventDefault).toHaveBeenCalled();
			expect(mockOnQuit).toHaveBeenCalled();
		});

		it("does nothing when isVoting is true", () => {
			const { result } = renderHook(() =>
				useTournamentKeyboard({ ...defaultOptions, isVoting: true }),
			);
			const event = createGlobalEvent("1");

			result.current.handleGlobalKeyDown(event);

			expect(event.preventDefault).not.toHaveBeenCalled();
			expect(mockOnVoteForSide).not.toHaveBeenCalled();
		});

		it("does nothing when isOpeningReveal is true", () => {
			const { result } = renderHook(() =>
				useTournamentKeyboard({ ...defaultOptions, isOpeningReveal: true }),
			);
			const event = createGlobalEvent("1");

			result.current.handleGlobalKeyDown(event);

			expect(event.preventDefault).not.toHaveBeenCalled();
			expect(mockOnVoteForSide).not.toHaveBeenCalled();
		});

		it("does nothing when target is an INPUT", () => {
			const { result } = renderHook(() => useTournamentKeyboard(defaultOptions));
			const input = document.createElement("input");
			const event = createGlobalEvent("1", input);

			result.current.handleGlobalKeyDown(event);

			expect(event.preventDefault).not.toHaveBeenCalled();
			expect(mockOnVoteForSide).not.toHaveBeenCalled();
		});

		it("does nothing when target is a TEXTAREA", () => {
			const { result } = renderHook(() => useTournamentKeyboard(defaultOptions));
			const textarea = document.createElement("textarea");
			const event = createGlobalEvent("1", textarea);

			result.current.handleGlobalKeyDown(event);

			expect(event.preventDefault).not.toHaveBeenCalled();
			expect(mockOnVoteForSide).not.toHaveBeenCalled();
		});

		it("does nothing when target is a SELECT", () => {
			const { result } = renderHook(() => useTournamentKeyboard(defaultOptions));
			const select = document.createElement("select");
			const event = createGlobalEvent("1", select);

			result.current.handleGlobalKeyDown(event);

			expect(event.preventDefault).not.toHaveBeenCalled();
			expect(mockOnVoteForSide).not.toHaveBeenCalled();
		});

		it("does nothing when target is contentEditable", () => {
			const { result } = renderHook(() => useTournamentKeyboard(defaultOptions));
			const div = document.createElement("div");
			div.isContentEditable = true;
			const event = createGlobalEvent("1", div);

			result.current.handleGlobalKeyDown(event);

			expect(event.preventDefault).not.toHaveBeenCalled();
			expect(mockOnVoteForSide).not.toHaveBeenCalled();
		});

		it("ignores unmapped keys", () => {
			const { result } = renderHook(() => useTournamentKeyboard(defaultOptions));
			const event = createGlobalEvent("a");

			result.current.handleGlobalKeyDown(event);

			expect(event.preventDefault).not.toHaveBeenCalled();
			expect(mockOnVoteForSide).not.toHaveBeenCalled();
			expect(mockOnUndo).not.toHaveBeenCalled();
			expect(mockOnQuit).not.toHaveBeenCalled();
		});

		it("does not early exit if target is not an HTMLElement", () => {
			const { result } = renderHook(() => useTournamentKeyboard(defaultOptions));
			const event = {
				key: "1",
				preventDefault: vi.fn(),
				target: new EventTarget(), // Not an HTMLElement
			} as unknown as globalThis.KeyboardEvent;

			result.current.handleGlobalKeyDown(event);

			expect(event.preventDefault).toHaveBeenCalled();
			expect(mockOnVoteForSide).toHaveBeenCalledWith("left");
		});

		it("does not early exit if target is null", () => {
			const { result } = renderHook(() => useTournamentKeyboard(defaultOptions));
			const event = {
				key: "1",
				preventDefault: vi.fn(),
				target: null,
			} as unknown as globalThis.KeyboardEvent;

			result.current.handleGlobalKeyDown(event);

			expect(event.preventDefault).toHaveBeenCalled();
			expect(mockOnVoteForSide).toHaveBeenCalledWith("left");
		});
	});
});
