/**
 * @fileoverview Focused tests for Login component
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import Login from "./Login";
import { validateUsername } from "../../shared/utils/validationUtils";

globalThis.fetch = vi.fn();

vi.mock("../../shared/utils/validationUtils", () => ({
  validateUsername: vi.fn(),
}));

describe("Login Component - Focused Tests", () => {
  const mockOnLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch.mockReset();
    globalThis.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ fact: "Cats sleep 12-16 hours per day!" }),
    });
  });

  it("renders hero copy, cat fact, and helper content", async () => {
    render(<Login onLogin={mockOnLogin} />);

    expect(
      screen.getByRole("heading", { name: "Ready to Judge the Names?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Now it's your turn! Enter your name to start judging cat names and help find the perfect one.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Your name")).toBeInTheDocument();
    expect(
      screen.getByText("We'll generate a fun name automatically!"),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText("Cats sleep 12-16 hours per day!"),
      ).toBeInTheDocument();
    });
  });

  it("fills in a generated name when the random name indicator is activated", async () => {
    const user = userEvent.setup();
    const deterministicRandom = vi.spyOn(Math, "random").mockReturnValue(0.01);

    render(<Login onLogin={mockOnLogin} />);

    await screen.findByText("Cats sleep 12-16 hours per day!");

    const randomButton = screen.getByRole("button", {
      name: "Generate a random judge name",
    });

    await user.click(randomButton);

    const input = screen.getByLabelText("Your name");
    await waitFor(() => {
      expect(input).toHaveValue("Captain Whiskers");
    });
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Generate a random judge name" }),
      ).not.toBeInTheDocument();
    });

    deterministicRandom.mockRestore();
  });

  it("submits a manually entered valid name", async () => {
    validateUsername.mockReturnValue({ success: true, value: "Judge Whisker" });
    mockOnLogin.mockResolvedValueOnce();

    render(<Login onLogin={mockOnLogin} />);
    await screen.findByText("Cats sleep 12-16 hours per day!");

    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Your name"), "Judge Whisker");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(validateUsername).toHaveBeenCalledWith("Judge Whisker");
      expect(mockOnLogin).toHaveBeenCalledWith("Judge Whisker");
    });
  });

  it("shows validation feedback when validation fails", async () => {
    const errorMessage = "That name is cursed by ancient cat magic.";
    validateUsername.mockReturnValue({ success: false, error: errorMessage });

    render(<Login onLogin={mockOnLogin} />);
    await screen.findByText("Cats sleep 12-16 hours per day!");

    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Your name"), "Bad Name");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(mockOnLogin).not.toHaveBeenCalled();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it("falls back to a default fact when fetching a cat fact fails", async () => {
    globalThis.fetch.mockRejectedValueOnce(new Error("nope"));

    render(<Login onLogin={mockOnLogin} />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Cats are amazing creatures with unique personalities!",
        ),
      ).toBeInTheDocument();
    });
  });

  it("disables browser autofill heuristics on the form controls", () => {
    render(<Login onLogin={mockOnLogin} />);

    return screen.findByText("Cats sleep 12-16 hours per day!").then(() => {
      const form = screen.getByRole("form", { name: "Judge name login form" });
      const input = screen.getByLabelText("Your name");

      expect(form).toHaveAttribute("autocomplete", "off");
      expect(input).toHaveAttribute("autocomplete", "off");
      expect(input).toHaveAttribute("autocapitalize", "none");
      expect(input).toHaveAttribute("spellcheck", "false");
      expect(input).toHaveAttribute("name", "judgeName");
    });
  });
});
