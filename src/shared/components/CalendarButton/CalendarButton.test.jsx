import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import CalendarButton from "./CalendarButton";

describe("CalendarButton", () => {
  const originalOpen = window.open;

  const renderAndOpen = (rankings, userName = "Test User") => {
    const { getByRole } = render(
      <CalendarButton rankings={rankings} userName={userName} />,
    );
    fireEvent.click(getByRole("button", { name: /add to google calendar/i }));
    const [[url]] = window.open.mock.calls;
    const [, queryString] = url.split("?");
    const params = new URLSearchParams(queryString);
    return { params, getByRole };
  };

  beforeEach(() => {
    window.open = vi.fn();
  });

  afterEach(() => {
    window.open = originalOpen;
    vi.restoreAllMocks();
  });

  it("excludes hidden names from the calendar payload", () => {
    const rankings = [
      { id: 1, name: "Whiskers", rating: 1600, is_hidden: false },
      { id: 2, name: "Shadow", rating: 1500, is_hidden: true },
    ];

    const { params } = renderAndOpen(rankings);
    expect(window.open).toHaveBeenCalledTimes(1);
    const details = params.get("details");

    expect(details).toContain("Whiskers");
    expect(details).not.toContain("Shadow");
  });

  it("lists visible names by descending rating and aligns winner with details", () => {
    const rankings = [
      { id: 1, name: "Luna", rating: 1675.4, is_hidden: false },
      { id: 2, name: "Milo", rating: 1801.2, is_hidden: false },
      { id: 3, name: "Bella", rating: 1720.6, is_hidden: false },
      { id: 4, name: "Oliver", rating: 1500, is_hidden: true },
    ];

    const { params } = renderAndOpen(rankings);
    const details = params.get("details");
    const text = params.get("text");

    const visibleRankings = rankings
      .filter((name) => !name.is_hidden)
      .sort((a, b) => (b.rating || 1500) - (a.rating || 1500));
    const expectedLines = visibleRankings.map(
      (name, index) =>
        `${index + 1}. ${name.name} (Rating: ${Math.round(name.rating || 1500)})`,
    );

    const detailLines = details
      .split("\n")
      .filter((line) => /^\d+\.\s/.test(line));

    expect(detailLines).toEqual(expectedLines);
    const expectedWinnerLine = `1. ${visibleRankings[0].name} (Rating: ${Math.round(
      visibleRankings[0].rating || 1500,
    )})`;

    expect(detailLines[0]).toBe(expectedWinnerLine);
    expect(text).toBe(`🐈‍⬛ ${visibleRankings[0].name}`);
  });

  it("filters out hidden names from calendar export", () => {
    const rankings = [
      { id: 1, name: "Whiskers", rating: 1600 },
      { id: 2, name: "Shadow", rating: 1500, is_hidden: true },
    ];

    const { getByRole } = renderAndOpen(rankings);
    const button = getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("handles empty rankings gracefully", () => {
    const rankings = [
      { id: 3, name: "Mittens", rating: 1400 },
      { id: 4, name: "Oliver", rating: 1500, is_hidden: true },
    ];

    renderAndOpen(rankings);

    // Verify that only visible names are included
    const visibleRankings = rankings
      .filter((name) => !name.is_hidden)
      .sort((a, b) => (b.rating || 1500) - (a.rating || 1500));
    const expectedLines = visibleRankings.map(
      (name, index) =>
        `${index + 1}. ${name.name} (Rating: ${Math.round(name.rating || 1500)})`,
    );

    expect(expectedLines).toEqual(["1. Mittens (Rating: 1400)"]);
  });
});
