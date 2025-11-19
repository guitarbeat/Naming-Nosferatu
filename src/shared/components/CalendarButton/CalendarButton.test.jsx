import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import CalendarButton from "./CalendarButton";

describe("CalendarButton", () => {
  const originalOpen = window.open;

  beforeEach(() => {
    window.open = vi.fn();
  });

  afterEach(() => {
    window.open = originalOpen;
    vi.restoreAllMocks();
  });

  it("excludes hidden names from the calendar payload", () => {
    const rankings = [
      { id: 1, name: "Whiskers", rating: 1600 },
      { id: 2, name: "Shadow", rating: 1500 },
    ];
    const hiddenNames = new Set([2]);

    const { getByRole } = render(
      <CalendarButton
        rankings={rankings}
        userName="Test User"
        hiddenNames={hiddenNames}
      />,
    );

    fireEvent.click(getByRole("button", { name: /add to google calendar/i }));

    expect(window.open).toHaveBeenCalledTimes(1);
    const [[url]] = window.open.mock.calls;
    const [, queryString] = url.split("?");
    const params = new URLSearchParams(queryString);
    const details = params.get("details");

    expect(details).toContain("Whiskers");
    expect(details).not.toContain("Shadow");
  });

  it("lists visible names by descending rating and aligns winner with details", () => {
    const rankings = [
      { id: 1, name: "Luna", rating: 1675.4 },
      { id: 2, name: "Milo", rating: 1801.2 },
      { id: 3, name: "Bella", rating: 1720.6 },
      { id: 4, name: "Oliver", rating: 1500 },
    ];
    const hiddenNames = new Set([4]);

    const { getByRole } = render(
      <CalendarButton
        rankings={rankings}
        userName="Test User"
        hiddenNames={hiddenNames}
      />,
    );

    fireEvent.click(getByRole("button", { name: /add to google calendar/i }));

    expect(window.open).toHaveBeenCalledTimes(1);
    const [[url]] = window.open.mock.calls;
    const [, queryString] = url.split("?");
    const params = new URLSearchParams(queryString);
    const details = params.get("details");
    const text = params.get("text");

    const visibleRankings = rankings
      .filter((name) => !hiddenNames.has(name.id))
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
});
