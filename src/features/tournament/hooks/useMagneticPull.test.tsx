import { renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import useMagneticPull from './useMagneticPull';

describe('useMagneticPull', () => {
  let requestAnimationFrameSpy: MockInstance;
  let cancelAnimationFrameSpy: MockInstance;

  beforeEach(() => {
    vi.useFakeTimers();
    requestAnimationFrameSpy = vi.spyOn(window, 'requestAnimationFrame');
    cancelAnimationFrameSpy = vi.spyOn(window, 'cancelAnimationFrame');
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  // Wrapper component to satisfy hook rules and provide refs
  function TestWrapper({ children, enabled = true }: { children: React.ReactNode, enabled?: boolean }) {
    const leftRef = useRef(document.createElement('div'));
    const rightRef = useRef(document.createElement('div'));
    useMagneticPull(leftRef, rightRef, enabled);
    return children;
  }

  it('should initialize and clean up correctly', () => {
    const { unmount } = renderHook(() => {}, {
      wrapper: ({ children }) => <TestWrapper enabled={true}>{children}</TestWrapper>
    });

    // Should have started animation loop
    expect(requestAnimationFrameSpy).toHaveBeenCalled();

    unmount();

    // Should have cancelled animation frame
    expect(cancelAnimationFrameSpy).toHaveBeenCalled();
  });

  it('should not do anything if disabled', () => {
    renderHook(() => {}, {
      wrapper: ({ children }) => <TestWrapper enabled={false}>{children}</TestWrapper>
    });

    expect(requestAnimationFrameSpy).not.toHaveBeenCalled();
  });
});
