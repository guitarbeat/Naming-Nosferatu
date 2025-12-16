import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import NameCard from "./NameCard";

describe("NameCard Accessibility", () => {
  const mockMetadata = {
    rating: 1200,
    wins: 10,
    losses: 5,
    winRate: 66,
    totalMatches: 15,
  };

  it("shows tooltip on focus for keyboard users", () => {
    render(
      <NameCard
        name="Whiskers"
        description="A cute cat"
        metadata={mockMetadata}
        // Make sure it's interactive or we force tabIndex in our fix
        onClick={() => {}}
      />
    );

    const card = screen.getByRole("button", { name: /Whiskers/i });

    // Initial state: tooltip should not be visible
    const tooltipText = screen.queryByText(/Total Matches/i);
    expect(tooltipText).not.toBeInTheDocument();

    // Focus the card
    fireEvent.focus(card);

    // Expect tooltip to be visible
    // Note: In the current implementation, this expectation should FAIL
    // because the tooltip is only triggered by mousemove
    expect(screen.getByText(/Total Matches/i)).toBeInTheDocument();
  });
});
