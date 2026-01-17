import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useAudioManager } from './TournamentHooks';

// Mock dependencies to avoid issues with imports
vi.mock('../../core/constants', () => ({
  TOURNAMENT_TIMING: {
    ROUND_TRANSITION_DELAY: 1000,
    VOTE_COOLDOWN: 500,
  }
}));

vi.mock('./TournamentLogic', () => ({
  tournamentsAPI: {},
  EloRating: class {},
  PreferenceSorter: class {},
  calculateBracketRound: () => 1,
}));

vi.mock('../../shared/services/errorManager', () => ({
  ErrorManager: { handleError: vi.fn() }
}));

vi.mock('../../shared/utils', () => ({
  shuffleArray: (arr: any[]) => arr,
  clearTournamentCache: vi.fn(),
  devError: vi.fn(),
  devLog: vi.fn(),
  devWarn: vi.fn(),
  isNameHidden: () => false,
  ratingsToArray: () => [],
  ratingsToObject: () => ({}),
}));

vi.mock('../../core/store/useAppStore', () => ({
  default: () => ({ user: {}, tournament: { ratings: {} }, tournamentActions: {} })
}));

vi.mock('../../core/hooks/useStorage', () => ({
  default: () => [{}, vi.fn()]
}));

vi.mock('../../core/hooks/useProfile', () => ({
  useProfile: () => ({})
}));

vi.mock('../../core/hooks/useProfileNotifications', () => ({
  useProfileNotifications: () => ({})
}));

vi.mock('../../shared/hooks/useAppHooks', () => ({
  useAdminStatus: () => ({ isAdmin: false })
}));

vi.mock('../../shared/hooks/useLightboxState', () => ({
  useLightboxState: () => ({})
}));

vi.mock('../../shared/components/Gallery', () => ({
  useImageGallery: () => ({})
}));


describe('useAudioManager', () => {
  it('should return a stable object reference on rerender', () => {
    const { result, rerender } = renderHook(() => useAudioManager());
    const firstResult = result.current;

    rerender();

    expect(result.current).toBe(firstResult);
  });

  it('should return new object when muted state changes', () => {
    const { result } = renderHook(() => useAudioManager());
    const firstResult = result.current;

    act(() => {
      result.current.handleToggleMute();
    });

    expect(result.current).not.toBe(firstResult);
    expect(result.current.isMuted).not.toBe(firstResult.isMuted);
  });

  it('should return new object when volume changes', () => {
    const { result } = renderHook(() => useAudioManager());
    const firstResult = result.current;

    act(() => {
      result.current.handleVolumeChange('music', 0.5);
    });

    expect(result.current).not.toBe(firstResult);
    expect(result.current.volume).toBe(0.5);
  });
});
