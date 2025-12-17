import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import Login from "./Login";

export const mockCatFact = "Cats sleep 12-16 hours per day!";

export const setupFetchSuccess = () => {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ fact: mockCatFact }),
  });
};

export const setupFetchFailure = (error = new Error("fetch failed")) => {
  globalThis.fetch = vi.fn().mockRejectedValue(error);
};

export const resetFetchMock = () => {
  if (globalThis.fetch?.mockReset) {
    globalThis.fetch.mockReset();
  }
};

export async function renderLoginAndWait(props = {}) {
  const utils = render(<Login {...props} />);
  await screen.findByText(mockCatFact);
  return utils;
}
