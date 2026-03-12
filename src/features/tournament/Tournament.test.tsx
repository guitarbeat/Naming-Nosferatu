import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Tournament from "./Tournament";

const mockHandleUndo = vi.fn();
const mockHandleQuit = vi.fn();
const mockHandleVoteWithAnimation = vi.fn();
const mockToggleMute = vi.fn();
const mockVolumeChange = vi.fn();
const mockPreviousTrack = vi.fn();
const mockNextTrack = vi.fn();
const mockToggleBackgroundMusic = vi.fn();
const mockPrimeAudio = vi.fn();
const mockState = {
	user: { name: "Test User" },
	ui: { showCatPictures: false },
	uiActions: { setCatPictures: vi.fn() },
	tournamentActions: { resetTournament: vi.fn() },
};

const mockTournamentState = {
	currentMatch: {
		mode: "1v1" as const,
		left: { id: "1", name: "Luna", description: "Calm cat" },
		right: { id: "2", name: "Nova", description: "Bright cat" },
	},
	ratings: { "1": 1500, "2": 1500 },
	round: 2,
	totalRounds: 4,
	bracketStage: "Semifinal",
	matchNumber: 3,
	totalMatches: 7,
	isComplete: false,
	tournamentMode: "1v1" as const,
	handleVote: vi.fn(),
	handleUndo: mockHandleUndo,
	canUndo: true,
	handleQuit: mockHandleQuit,
	progress: 42,
	etaMinutes: 3,
	isVoting: false,
	handleVoteWithAnimation: mockHandleVoteWithAnimation,
	matchHistory: [],
};

vi.mock("@/store/appStore", () => ({
	default: (selector: (state: typeof mockState) => unknown) => selector(mockState),
}));

vi.mock("./hooks", () => ({
	useAudioManager: () => ({
		isMuted: false,
		volume: 0.5,
		backgroundMusicEnabled: true,
		currentTrack: "Moonlit Paws",
		handleToggleMute: mockToggleMute,
		handleVolumeChange: mockVolumeChange,
		handlePreviousTrack: mockPreviousTrack,
		handleNextTrack: mockNextTrack,
		toggleBackgroundMusic: mockToggleBackgroundMusic,
		playLevelUpSound: vi.fn(),
		playWowSound: vi.fn(),
		playSurpriseSound: vi.fn(),
		playStreakSound: vi.fn(),
		primeAudioExperience: mockPrimeAudio,
	}),
}));

vi.mock("./hooks/useTournamentState", () => ({
	useTournamentState: () => mockTournamentState,
}));

describe("Tournament", () => {
	beforeEach(() => {
		mockHandleUndo.mockReset();
		mockHandleQuit.mockReset();
		mockHandleVoteWithAnimation.mockReset();
		mockToggleMute.mockReset();
		mockVolumeChange.mockReset();
		mockPreviousTrack.mockReset();
		mockNextTrack.mockReset();
		mockToggleBackgroundMusic.mockReset();
		mockPrimeAudio.mockReset();
		mockState.ui.showCatPictures = false;
		mockState.uiActions.setCatPictures.mockReset();
		mockState.tournamentActions.resetTournament.mockReset();
	});

	it("shows a clear vote hint and labeled mobile action buttons", () => {
		render(
			<MemoryRouter>
				<Tournament
					names={[
						{ id: "1", name: "Luna", description: "Calm cat" },
						{ id: "2", name: "Nova", description: "Bright cat" },
					]}
					onComplete={vi.fn()}
				/>
			</MemoryRouter>,
		);

		expect(screen.getByText("Pick The Winner")).toBeInTheDocument();
		expect(
			screen.getByText("Tap a card to pick the winner. Use Undo if you miss."),
		).toBeInTheDocument();
		expect(
			screen.getByText("Click a card to pick the winner, or focus it and press Enter or Space."),
		).toBeInTheDocument();

		const undoLabel = screen.getByText("Undo");
		const quitLabel = screen.getByText("Quit");

		expect(undoLabel).toHaveClass("sm:hidden");
		expect(quitLabel).toHaveClass("sm:hidden");
		expect(undoLabel.closest("button")).toHaveAttribute("aria-label", "Undo last vote");
		expect(quitLabel.closest("button")).toHaveAttribute("aria-label", "Quit tournament");
	});
});
