// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { AdminNamesTab } from '../AdminNamesTab';

describe('AdminNamesTab', () => {
  const mockNames = [
    {
      id: '1',
      name: 'Fluffy',
      description: 'A very fluffy cat',
      status: 'active',
      is_hidden: false,
      is_locked: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: null,
      votes: 10,
      popularityScore: 5.5,
    },
  ];

  it('associates checkbox with name label and allows selection by clicking the name', () => {
    const handleSelectionChange = vi.fn();

    render(
      <AdminNamesTab
        searchTerm=""
        onSearchTermChange={() => {}}
        filterStatus="all"
        filterOptions={[{ value: 'all', label: 'All' }]}
        onFilterChange={() => {}}
        onRefresh={() => {}}
        selectedNames={new Set()}
        onBulkAction={() => {}}
        onClearSelection={() => {}}
        filteredNames={mockNames as any}
        onSelectionChange={handleSelectionChange}
        onToggleHidden={() => {}}
        onToggleLocked={() => {}}
        onDelete={() => {}}
      />
    );

    // Verify checkbox is accessible
    const checkbox = screen.getByRole('checkbox', { name: /Select Fluffy/i });
    expect(checkbox).toBeInTheDocument();

    // In our component, we might have kept aria-label on checkbox,
    // but we can click the label that has the text 'Fluffy'
    const nameLabel = screen.getByText('Fluffy');
    expect(nameLabel.tagName).toBe('LABEL');

    // We expect the label to be linked to the checkbox
    expect(nameLabel).toHaveAttribute('for', checkbox.id);

    // Clicking the label should trigger the onChange
    fireEvent.click(nameLabel);

    // Fire event click on label usually triggers click on checkbox in JSDOM,
    // but since we are stubbing onChange, we might need to check if the spy was called.
    expect(handleSelectionChange).toHaveBeenCalledWith('1', true);
  });
});
