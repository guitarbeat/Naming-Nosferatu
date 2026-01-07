
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTournamentState } from './tournamentComponentHooks';

// Mock the core hook
const mockHandleVote = vi.fn();
const mockTournament = {
  currentMatch: { left: 'A', right: 'B' },
  roundNumber: 1,
  handleVote: mockHandleVote,
  isError: false,
};

vi.mock('../../../core/hooks/tournamentHooks', () => ({
  useTournament: () => mockTournament,
}));

// Mock shuffleArray
vi.mock('../../../shared/utils/core', () => ({
  shuffleArray: (arr: any[]) => [...arr].reverse(), // Simple deterministic shuffle
}));

describe('useTournamentState', () => {
  const mockNames = [{ id: '1', name: 'Cat A' }, { id: '2', name: 'Cat B' }];
  const mockOnComplete = vi.fn();
  const mockOnVote = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockTournament.roundNumber = 1;
    mockTournament.isError = false;
  });

  it('should initialize with randomized names', () => {
    const { result } = renderHook(() =>
      useTournamentState(mockNames, {}, mockOnComplete, mockOnVote)
    );

    // Expect reversed order due to mock shuffle
    expect(result.current.randomizedNames).toHaveLength(2);
    expect(result.current.randomizedNames[0].name).toBe('Cat B');
  });

  it('should handle option selection', () => {
    const { result } = renderHook(() =>
      useTournamentState(mockNames, {}, mockOnComplete, mockOnVote)
    );

    act(() => {
      result.current.setSelectedOption('left');
    });

    expect(result.current.selectedOption).toBe('left');
  });

  it('should trigger round transition when round number increases', () => {
    const { result, rerender } = renderHook(() =>
      useTournamentState(mockNames, {}, mockOnComplete, mockOnVote)
    );

    expect(result.current.showRoundTransition).toBe(false);

    // Simulate round change
    mockTournament.roundNumber = 2;
    rerender();

    expect(result.current.showRoundTransition).toBe(true);
  });

  it('should reset state on error', () => {
    const { result, rerender } = renderHook(() =>
      useTournamentState(mockNames, {}, mockOnComplete, mockOnVote)
    );

    act(() => {
      result.current.setIsProcessing(true);
      result.current.setSelectedOption('left');
    });

    // Simulate error
    mockTournament.isError = true;
    rerender();

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.selectedOption).toBeNull();
  });

  it('should adapt handleVote arguments correctly', async () => {
    const { result } = renderHook(() =>
      useTournamentState(mockNames, {}, mockOnComplete, mockOnVote)
    );

    await act(async () => {
      await result.current.handleVote('left');
    });

    expect(mockHandleVote).toHaveBeenCalledWith('left', 'normal');

    await act(async () => {
      await result.current.handleVote('both');
    });

    expect(mockHandleVote).toHaveBeenCalledWith('both', 'both');
  });
});
