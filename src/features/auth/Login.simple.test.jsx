/**
 * @fileoverview Simple tests for Login component
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Login from './Login';
import { validateUsername } from '../../shared/utils/validationUtils';

// * Mock fetch for cat facts
globalThis.fetch = vi.fn();

// * Mock useToast hook
const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();
vi.mock('../../core/hooks/useToast', () => ({
  default: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError
  })
}));

// * Mock validateUsername
vi.mock('../../shared/utils/validationUtils', () => ({
  validateUsername: vi.fn()
}));

describe('Login Component - Simple Tests', () => {
  const mockOnLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // * Mock successful cat fact fetch
    globalThis.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ fact: 'Cats sleep 12-16 hours per day!' })
    });
  });

  it('renders without crashing', () => {
    expect(() => render(<Login onLogin={mockOnLogin} />)).not.toThrow();
  });

  it('renders main title', () => {
    render(<Login onLogin={mockOnLogin} />);
    expect(screen.getByText('Ready to Judge the Names?')).toBeInTheDocument();
  });

  it('renders login form title', () => {
    render(<Login onLogin={mockOnLogin} />);
    expect(screen.getByText('Your Judge Name')).toBeInTheDocument();
  });

  it('renders login subtitle', () => {
    render(<Login onLogin={mockOnLogin} />);
    expect(
      screen.getByText(/Enter your name to start judging cat names/i)
    ).toBeInTheDocument();
  });

  it('renders random name description when collapsed', () => {
    render(<Login onLogin={mockOnLogin} />);
    expect(
      screen.getByText("We'll generate a fun name automatically!")
    ).toBeInTheDocument();
  });

  it('submits a valid name and calls onLogin', async () => {
    const user = userEvent.setup();
    validateUsername.mockReturnValue({ success: true, value: 'Judge Whisker' });
    mockOnLogin.mockResolvedValueOnce();

    render(<Login onLogin={mockOnLogin} />);

    await user.type(screen.getByLabelText('Your name'), 'Judge Whisker');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(validateUsername).toHaveBeenCalledWith('Judge Whisker');
    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalledWith('Judge Whisker');
    });
  });

  it('shows validation error and does not call onLogin when validation fails', async () => {
    const user = userEvent.setup();
    validateUsername.mockReturnValue({
      success: false,
      error: 'Name is invalid'
    });

    render(<Login onLogin={mockOnLogin} />);

    await user.type(screen.getByLabelText('Your name'), 'Invalid Name');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(mockOnLogin).not.toHaveBeenCalled();
    expect(screen.getByText('Name is invalid')).toBeInTheDocument();
  });
});
