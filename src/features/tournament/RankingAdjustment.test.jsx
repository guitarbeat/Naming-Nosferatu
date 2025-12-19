import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RankingAdjustment from './RankingAdjustment';

// Mock the Card component since it uses specific styling that might not be relevant for this test
vi.mock('../../shared/components/Card', () => ({
  default: ({ children, className }) => <div className={className} data-testid="mock-card">{children}</div>
}));

// Mock ErrorManager
vi.mock('../../shared/services/errorManager', () => ({
  ErrorManager: {
    handleError: vi.fn(),
  }
}));

// Mock @hello-pangea/dnd to render children directly
// This avoids issues with drag and drop context in tests
vi.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }) => <div data-testid="dnd-context">{children}</div>,
  Droppable: ({ children }) => children(
    { draggableProps: {}, innerRef: vi.fn() },
    { isDraggingOver: false }
  ),
  Draggable: ({ children }) => children(
    { draggableProps: {}, dragHandleProps: {}, innerRef: vi.fn() },
    { isDragging: false }
  ),
}));

describe('RankingAdjustment', () => {
  const mockRankings = [
    { name: 'Cat A', rating: 1500, wins: 10, losses: 5 },
    { name: 'Cat B', rating: 1400, wins: 8, losses: 7 },
  ];
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  it('renders without crashing', () => {
    render(
      <RankingAdjustment
        rankings={mockRankings}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByText('Your Cat Name Rankings')).toBeInTheDocument();
  });

  it('renders the list of rankings', () => {
    render(
      <RankingAdjustment
        rankings={mockRankings}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByText('Cat A')).toBeInTheDocument();
    expect(screen.getByText('Cat B')).toBeInTheDocument();
    expect(screen.getByText('Rating: 1500')).toBeInTheDocument();
    expect(screen.getByText('Rating: 1400')).toBeInTheDocument();
  });

  it('renders correct number of items', () => {
    render(
      <RankingAdjustment
        rankings={mockRankings}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );
    // There might be multiple elements with class "ranking-card" if we check className,
    // so checking for names is a good proxy.
    expect(screen.getAllByText(/Rating:/)).toHaveLength(2);
  });
});
