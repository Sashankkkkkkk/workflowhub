import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Newer Node versions ship their own (broken in tests) localStorage global that hides the
// jsdom one. Provide a small in-memory implementation so the tests behave the same everywhere.
const store = new Map();
const memoryStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear(),
  key: (index) => Array.from(store.keys())[index] ?? null,
  get length() {
    return store.size;
  },
};
vi.stubGlobal("localStorage", memoryStorage);
