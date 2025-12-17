import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
// @ts-ignore - Login is a JSX file
import Login from "./Login";

export const mockCatFact = "Cats sleep 12-16 hours per day!";

export const setupFetchSuccess = () => {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ fact: mockCatFact }),
  }) as unknown as typeof fetch;
};

export const setupFetchFailure = (error = new Error("fetch failed")) => {
  globalThis.fetch = vi
    .fn()
    .mockRejectedValue(error) as unknown as typeof fetch;
};

export const resetFetchMock = () => {
  const fetchMock = globalThis.fetch as unknown as { mockReset?: () => void };
  if (fetchMock?.mockReset) {
    fetchMock.mockReset();
  }
};

export async function renderLoginAndWait(props = {}) {
  const utils = render(<Login {...props} />);
  await screen.findByText(mockCatFact);
  return utils;
}

export async function submitLoginForm(name: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Your name"), name);
  await user.click(
    screen.getByRole("button", { name: "Continue to tournament" }),
  );
}

