import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App.jsx";

describe("App", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("shows the login form when signed out", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "WorkFlowHub" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Log in" })).toBeInTheDocument();
  });

  it("loads workflow items from the API when a session exists", async () => {
    localStorage.setItem(
      "workflowhub-session",
      JSON.stringify({ token: "abc123", username: "alice" })
    );
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [
        { id: 1, title: "Write report", description: "Task 1", status: "pending" },
      ],
    });

    render(<App />);

    await waitFor(() => expect(screen.getByText("Write report")).toBeInTheDocument());
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/workflow-items\/$/);
    expect(options.headers.Authorization).toBe("Token abc123");
  });
});
