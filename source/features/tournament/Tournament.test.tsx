import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Tournament from "./Tournament";
import * as TournamentHooks from "./TournamentHooks";
import { TournamentProps } from "../../types/components";

// Mock hooks
vi.mock("./TournamentHooks", async () => {
    const actual = await vi.importActual("./TournamentHooks");
    return {
        ...actual,
        useTournamentState: vi.fn(),
        useTournamentVote: vi.fn(),
        useAudioManager: vi.fn(),
    };
});

// Mock child components to check props
vi.mock("./TournamentViews", () => ({
    TournamentHeader: () => <div data-testid="TournamentHeader" />,
    TournamentControls: () => <div data-testid="TournamentControls" />,
    TournamentFooter: vi.fn(({ transformedMatches }) => <div data-testid="TournamentFooter" data-matches-len={transformedMatches.length} />),
    TournamentMatch: () => <div data-testid="TournamentMatch" />,
}));

vi.mock("./TournamentOverlays", () => ({
    KeyboardHelp: () => <div data-testid="KeyboardHelp" />,
    MatchResult: () => <div data-testid="MatchResult" />,
    RoundTransition: () => <div data-testid="RoundTransition" />,
    UndoBanner: vi.fn(({ undoExpiresAt, undoStartTime }) => <div data-testid="UndoBanner" data-expires={undoExpiresAt} data-start={undoStartTime} />),
}));

// Mock shared components
vi.mock("../../shared/components/ErrorComponent", () => ({
    ErrorComponent: ({ children }: any) => <div>{children}</div>,
}));
vi.mock("../../shared/components/Loading", () => ({
    Loading: () => <div>Loading...</div>,
}));
vi.mock("../../shared/hooks/useAppHooks", () => ({
    useToast: () => ({ showSuccess: vi.fn(), showError: vi.fn() }),
}));

describe("Tournament", () => {
    it("renders correctly and passes stable props", () => {
        // Setup mock return values
        const mockTournamentState = {
            selectedOption: null,
            setSelectedOption: vi.fn(),
            isTransitioning: false,
            setIsTransitioning: vi.fn(),
            isProcessing: false,
            setIsProcessing: vi.fn(),
            lastMatchResult: null,
            setLastMatchResult: vi.fn(),
            showMatchResult: false,
            setShowMatchResult: vi.fn(),
            showBracket: false,
            setShowBracket: vi.fn(),
            showKeyboardHelp: false,
            setShowKeyboardHelp: vi.fn(),
            showRoundTransition: false,
            nextRoundNumber: null,
            votingError: null,
            setVotingError: vi.fn(),
            handleVote: vi.fn(),
            tournament: {
                currentMatch: { left: "A", right: "B" },
                progress: 0,
                roundNumber: 1,
                currentMatchNumber: 1,
                totalMatches: 10,
                handleUndo: vi.fn(),
            },
        };

        (TournamentHooks.useTournamentState as any).mockReturnValue(mockTournamentState);
        (TournamentHooks.useTournamentVote as any).mockReturnValue({ handleVoteWithAnimation: vi.fn() });
        (TournamentHooks.useAudioManager as any).mockReturnValue({
            isMuted: false,
            handleToggleMute: vi.fn(),
            handleNextTrack: vi.fn(),
            volume: 0.5,
            handleVolumeChange: vi.fn(),
        });

        const props: TournamentProps = {
            names: [{ id: "1", name: "Cat 1" }, { id: "2", name: "Cat 2" }],
            onComplete: vi.fn(),
        };

        const { rerender } = render(<Tournament {...props} />);

        expect(screen.getByTestId("TournamentFooter")).toBeInTheDocument();
        expect(screen.getByTestId("UndoBanner")).toBeInTheDocument();

        // Check initial props
        const footer = screen.getByTestId("TournamentFooter");
        expect(footer).toHaveAttribute("data-matches-len", "0");

        const banner = screen.getByTestId("UndoBanner");
        expect(banner).toHaveAttribute("data-expires", "1");
        expect(banner).toHaveAttribute("data-start", "1");

        // Rerender to check stability
        rerender(<Tournament {...props} />);

        // We verified that 1 is passed, not Date.now()
    });
});
