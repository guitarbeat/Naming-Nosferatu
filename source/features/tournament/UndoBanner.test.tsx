import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UndoBanner } from './TournamentOverlays';

// Mocking styles since we are in a test environment and CSS modules might not be parsed correctly or at all
vi.mock('./tournament.module.css', () => ({
    default: {
        undoBanner: 'undoBanner',
        undoBannerContent: 'undoBannerContent',
        undoButton: 'undoButton',
    },
}));

describe('UndoBanner', () => {
    it('renders correctly', () => {
        const handleUndo = vi.fn();
        render(
            <UndoBanner
                onUndo={handleUndo}
            />
        );
        expect(screen.getByText('Choice made.')).toBeDefined();
        expect(screen.getByRole('button', { name: /undo/i })).toBeDefined();
    });

    it('calls onUndo when button is clicked', () => {
        const handleUndo = vi.fn();
        render(
            <UndoBanner
                onUndo={handleUndo}
            />
        );
        fireEvent.click(screen.getByRole('button', { name: /undo/i }));
        expect(handleUndo).toHaveBeenCalled();
    });
});
