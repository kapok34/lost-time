import { vi } from "vitest";
import "@testing-library/jest-dom";

// Mock Deno for edge function tests
// @ts-expect-error Deno is not available in Node test env
(globalThis as any).Deno = {
  env: {
    _store: {} as Record<string, string>,
    get: (key: string) => ((globalThis as any).Deno.env._store[key] ?? undefined),
  },
};

// Mock localStorage for tests
const localStorageData: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => localStorageData[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { localStorageData[key] = value; }),
  removeItem: vi.fn((key: string) => { delete localStorageData[key]; }),
  clear: vi.fn(() => { Object.keys(localStorageData).forEach(k => delete localStorageData[k]); }),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock scrollIntoView for Radix UI components in jsdom
if (!window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = () => {};
}

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
