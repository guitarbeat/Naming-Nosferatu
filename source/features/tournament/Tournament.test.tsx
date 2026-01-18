import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import Tournament from "./Tournament";

// Hoist the spy so we can use it in mock and assertion
const { footerSpy } = vi.hoisted(() => {
  return { footerSpy: vi.fn(() => <div data-testid="footer">Footer</div>) };
});

// Stable mocks
const mockSetSelectedOption = vi.fn();
const mockSetLastMatchResult = vi.fn();
const mockSetShowMatchResult = vi.fn();
const mockSetShowBracket = vi.fn();
const mockSetShowKeyboardHelp = vi.fn();
const mockSetVotingError = vi.fn();
const mockHandleVote = vi.fn();
const mockHandleUndo = vi.fn();
const mockHandleVoteWithAnimation = vi.fn();
const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();
const mockHandleToggleMute = vi.fn();
const mockHandleNextTrack = vi.fn();
const mockHandleVolumeChange = vi.fn();
const mockSetIsProcessing = vi.fn();
const mockSetIsTransitioning = vi.fn();

// Mock child components
vi.mock("./TournamentViews", async () => {
  const React = await import("react");
  return {
    TournamentHeader: () => <div data-testid="header">Header</div>,
    TournamentControls: vi.fn(({ onToggleCatPictures }) => (
        <div data-testid="controls">
            <button onClick={onToggleCatPictures}>Toggle Cats</button>
        </div>
    )),
    // Memoize the spy to test prop stability
    TournamentFooter: React.memo(footerSpy),
    TournamentMatch: vi.fn(() => <div data-testid="match">Match</div>),
    SwipeableCards: () => <div>SwipeableCards</div>,
  };
});

vi.mock("./TournamentOverlays", () => ({
  UndoBanner: vi.fn(() => <div data-testid="undo-banner">UndoBanner</div>),
  MatchResult: () => <div>MatchResult</div>,
  RoundTransition: () => <div>RoundTransition</div>,
  KeyboardHelp: () => <div>KeyboardHelp</div>,
}));

// Mock hooks
vi.mock("./TournamentHooks", () => ({
  useAudioManager: () => ({
    isMuted: false,
    volume: 0.5,
    handleToggleMute: mockHandleToggleMute,
    handleNextTrack: mockHandleNextTrack,
    handleVolumeChange: mockHandleVolumeChange,
  }),
  useTournamentState: () => ({
    selectedOption: null,
    setSelectedOption: mockSetSelectedOption,
    isTransitioning: false,
    setIsTransitioning: mockSetIsTransitioning,
    isProcessing: false,
    setIsProcessing: mockSetIsProcessing,
    lastMatchResult: null,
    setLastMatchResult: mockSetLastMatchResult,
    showMatchResult: false,
    setShowMatchResult: mockSetShowMatchResult,
    showBracket: false,
    setShowBracket: mockSetShowBracket,
    showKeyboardHelp: false,
    setShowKeyboardHelp: mockSetShowKeyboardHelp,
    showRoundTransition: false,
    nextRoundNumber: null,
    votingError: null,
    setVotingError: mockSetVotingError,
    handleVote: mockHandleVote,
    tournament: {
      currentMatch: { left: { name: "A", id: "1" }, right: { name: "B", id: "2" } },
      progress: 0,
      roundNumber: 1,
      currentMatchNumber: 1,
      totalMatches: 10,
      handleUndo: mockHandleUndo,
      matchHistory: [],
    }
  }),
  useTournamentVote: () => ({
    handleVoteWithAnimation: mockHandleVoteWithAnimation,
  }),
}));

vi.mock("../../shared/hooks/useAppHooks", () => ({
  useToast: () => ({ showSuccess: mockShowSuccess, showError: mockShowError }),
}));

vi.mock("../../shared/utils", () => ({
  getVisibleNames: (names: any) => names,
}));

describe("Tournament Performance", () => {
    it("should minimize re-renders when state changes", async () => {
        const onComplete = vi.fn();
        render(<Tournament names={[]} onComplete={onComplete} />);

        // Initial render count
        expect(footerSpy).toHaveBeenCalledTimes(1);

        // Trigger a state change in TournamentContent (toggle cat pictures)
        const toggleBtn = screen.getByText("Toggle Cats");
        fireEvent.click(toggleBtn);

        // Optimized: TournamentFooter should NOT re-render when showCatPictures changes
        // because props are now stable callbacks.
        expect(footerSpy).toHaveBeenCalledTimes(1);
    });
});
