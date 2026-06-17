/**
 * Regression tests for CreditProvider:
 *  - Renders inside <BrowserRouter> without throwing (useLocation crash regression)
 *  - Refetches credits when the route changes
 *  - Hydrates initial balance from sessionStorage so deep-link / refresh paints
 *    the correct value without a loading flash
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useNavigate } from "react-router-dom";

// ---- Mocks -----------------------------------------------------------------

const fetchSpy = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

vi.mock("@/integrations/supabase/client", () => {
  const builder = () => {
    const b: Record<string, unknown> = {};
    const chain = () => b;
    b.select = chain; b.eq = chain; b.gt = chain; b.order = () => {
      fetchSpy();
      return Promise.resolve({ data: [{ balance: 42, expires_at: "2099-01-01T00:00:00Z" }], error: null });
    };
    return b;
  };
  return {
    supabase: {
      from: () => builder(),
      channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
      removeChannel: () => {},
    },
  };
});

// Import AFTER mocks
import { CreditProvider, useCredits } from "./useCredits";

const Display = () => {
  const { balance, initialized } = useCredits();
  return <div data-testid="balance">{initialized ? balance : "…"}</div>;
};

const Nav = () => {
  const navigate = useNavigate();
  return <button data-testid="go" onClick={() => navigate("/other")}>go</button>;
};

const renderApp = (initialEntries: string[] = ["/"]) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <CreditProvider>
        <Nav />
        <Routes>
          <Route path="/" element={<Display />} />
          <Route path="/other" element={<Display />} />
        </Routes>
      </CreditProvider>
    </MemoryRouter>,
  );

beforeEach(() => {
  fetchSpy.mockClear();
  sessionStorage.clear();
});

describe("CreditProvider", () => {
  it("mounts inside Router without throwing and renders balance", async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId("balance").textContent).toBe("42"));
    expect(fetchSpy).toHaveBeenCalled();
  });

  it("refetches credits on route change (regression: routing sync)", async () => {
    renderApp();
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const before = fetchSpy.mock.calls.length;
    // Wait past the 1.5s throttle window, then navigate
    await new Promise((r) => setTimeout(r, 1700));
    await act(async () => {
      screen.getByTestId("go").click();
    });
    await waitFor(() => expect(fetchSpy.mock.calls.length).toBeGreaterThan(before), { timeout: 4000 });
  }, 10000);

  it("hydrates initial balance from sessionStorage on deep-link entry", async () => {
    sessionStorage.setItem(
      "med1:credits:v1",
      JSON.stringify({ userId: "user-1", balance: 99, expiresAt: "2099-01-01", cachedAt: Date.now() }),
    );
    renderApp(["/other"]);
    // No loading flash — initial render already shows cached balance
    expect(screen.getByTestId("balance").textContent).toBe("99");
  });
});
