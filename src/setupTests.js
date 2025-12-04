// * Test setup file for vitest
import { vi } from "vitest";
import React from "react";
import "@testing-library/jest-dom";

// * Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// * Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// * Mock ResizeObserver
globalThis.ResizeObserver = class ResizeObserver {
  constructor() {
    this.observe = vi.fn();
    this.unobserve = vi.fn();
    this.disconnect = vi.fn();
  }
};

// * Mock IntersectionObserver
globalThis.IntersectionObserver = class IntersectionObserver {
  constructor() {
    this.observe = vi.fn();
    this.unobserve = vi.fn();
    this.disconnect = vi.fn();
  }
};

// * Mock Supabase (both the integration client and the package)
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
    delete: vi.fn(() => Promise.resolve({ data: null, error: null })),
  })),
};

vi.mock("../shared/services/supabase/client", () => ({
  supabase: mockSupabase,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => mockSupabase),
}));

// * Mock react-responsive-masonry for test environment
// * This library has issues with property setters in test environments
vi.mock("react-responsive-masonry", () => {
  const MockMasonry = ({ children, className }) =>
    React.createElement(
      "div",
      { className, "data-testid": "masonry" },
      children,
    );

  const MockResponsiveMasonry = ({ children, className }) =>
    React.createElement(
      "div",
      { className, "data-testid": "responsive-masonry" },
      children,
    );

  return {
    default: MockMasonry,
    ResponsiveMasonry: MockResponsiveMasonry,
  };
});
