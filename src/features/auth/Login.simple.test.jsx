/**
 * @fileoverview Simple tests for Login component
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import Login from "./Login";
import { validateUsername } from "../../shared/utils/validationUtils";
import {
  mockCatFact,
  renderLoginAndWait,
  setupFetchSuccess,
} from "./loginTestUtils";

// * Mock useToast hook
const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();
vi.mock("../../core/hooks/useToast", () => ({
  default: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
  }),
}));

// * Mock validateUsername
vi.mock("../../shared/utils/validationUtils", () => ({
  validateUsername: vi.fn(),
}));

describe("Login Component - Simple Tests", () => {
  const mockOnLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    setupFetchSuccess();
  });

  it("renders without crashing", async () => {
    render(<Login onLogin={mockOnLogin} />);
    await screen.findByText(mockCatFact);
  });

  it("renders main title", async () => {
    await renderLoginAndWait({ onLogin: mockOnLogin });
    expect(screen.getByText("Ready to Rate Cat Names?")).toBeInTheDocument();
  });

  it("renders login form title", async () => {
    await renderLoginAndWait({ onLogin: mockOnLogin });
    expect(screen.getByText("Ready to Rate Cat Names?")).toBeInTheDocument();
  });

  it("renders login subtitle", async () => {
    await renderLoginAndWait({ onLogin: mockOnLogin });
    // * Component shows help text instead of subtitle
    expect(
      screen.getByText(
        /We'll create an account automatically if it's your first time/i,
      ),
    ).toBeInTheDocument();
  });

  it("renders random name description when collapsed", async () => {
    await renderLoginAndWait({ onLogin: mockOnLogin });
    expect(
      screen.getByText(
        "We'll create an account automatically if it's your first time.",
      ),
    ).toBeInTheDocument();
  });

  it("submits a valid name and calls onLogin", async () => {
    validateUsername.mockReturnValue({ success: true, value: "Judge Whisker" });
    mockOnLogin.mockResolvedValueOnce();

    await renderLoginAndWait({ onLogin: mockOnLogin });

    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Your name"), "Judge Whisker");
    await user.click(
      screen.getByRole("button", { name: "Continue to tournament" }),
    );

    await waitFor(() => {
      expect(validateUsername).toHaveBeenCalledWith("Judge Whisker");
      expect(mockOnLogin).toHaveBeenCalledWith("Judge Whisker");
    });
  });

  it("shows validation error and does not call onLogin when validation fails", async () => {
    validateUsername.mockReturnValue({
      success: false,
      error: "Name is invalid",
    });

    await renderLoginAndWait({ onLogin: mockOnLogin });

    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Your name"), "Invalid Name");
    await user.click(
      screen.getByRole("button", { name: "Continue to tournament" }),
    );

    await waitFor(() => {
      expect(mockOnLogin).not.toHaveBeenCalled();
      expect(screen.getByText("Name is invalid")).toBeInTheDocument();
    });
  });
});
