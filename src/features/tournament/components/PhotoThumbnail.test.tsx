import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PhotoThumbnail } from './PhotoComponents';
import React from 'react';

// Mock getBoundingClientRect since it returns zeros in JSDOM
const mockGetBoundingClientRect = vi.fn(() => ({
  left: 0,
  top: 0,
  width: 200,
  height: 200,
  x: 0,
  y: 0,
  right: 200,
  bottom: 200,
  toJSON: () => {}
}));

describe('PhotoThumbnail', () => {
  beforeEach(() => {
    // Setup RAF mock
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      // Execute callback immediately for testing
      cb(performance.now());
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('applies 3D tilt transform on mouse move using RAF', async () => {
    const props = {
      image: 'test.jpg', // Changed from src to image
      index: 0,
      onImageOpen: vi.fn(),
    };

    render(<PhotoThumbnail {...props} />);

    // PhotoThumbnail renders a button
    const container = screen.getByRole('button', { name: /Open cat photo/i });
    if (!container) throw new Error('Container not found');

    // Mock getBoundingClientRect
    Object.defineProperty(container, 'getBoundingClientRect', {
      value: mockGetBoundingClientRect
    });
    Object.defineProperty(container, 'isConnected', {
        value: true
    });

    // 1. Move to Top Left (0,0) -> Should rotate
    fireEvent.mouseMove(container, { clientX: 0, clientY: 0 });
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(container.style.transform).toContain('perspective(1000px)');
    // y=-100, centerY=100 -> -1 * -5 = 5deg X
    // x=-100, centerX=100 -> -1 * 5 = -5deg Y
    expect(container.style.transform).toContain('rotateX(5deg)');

    // 2. Move to Center (100,100) -> Should be 0 rotation
    fireEvent.mouseMove(container, { clientX: 100, clientY: 100 });

    // NOTE: The implementation uses a closure for 'rafId' and handles updates.
    // If the test mock executes immediately, it might be that the component
    // state (refs) needs a tick to update 'mousePos' before the RAF callback reads it?
    // Actually, mousePos is mutable in the component, so it should be fine.
    // The issue might be that RAF isn't called again if 'rafId' isn't cleared?
    // The component code:
    // if (rafId === null) { rafId = requestAnimationFrame(updateTilt); }
    // updateTilt sets rafId = null at the end.
    // So subsequent moves should trigger new RAF.

    await new Promise(resolve => setTimeout(resolve, 0));

    // Debug output if fails
    // console.log(container.style.transform);

    // Should be rotateX(0deg) rotateY(0deg)
    expect(container.style.transform).toContain('rotateX(0deg)');
    expect(container.style.transform).toContain('rotateY(0deg)');
  });

  it('resets transform on mouse leave', async () => {
    const props = {
      image: 'test.jpg',
      index: 0,
      onImageOpen: vi.fn(),
    };

    render(<PhotoThumbnail {...props} />);

    const container = screen.getByRole('button', { name: /Open cat photo/i });
    Object.defineProperty(container, 'getBoundingClientRect', {
      value: mockGetBoundingClientRect
    });
    Object.defineProperty(container, 'isConnected', {
        value: true
    });

    // Move first
    fireEvent.mouseMove(container, { clientX: 0, clientY: 0 });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(container.style.transform).not.toBe('');

    // Leave
    fireEvent.mouseLeave(container);
    await new Promise(resolve => setTimeout(resolve, 0));

    // Should reset
    expect(container.style.transform).toContain('rotateX(0deg)');
  });
});
