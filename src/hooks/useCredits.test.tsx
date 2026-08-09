/**
 * Regression tests for CreditProvider:
 *  - Renders inside <BrowserRouter> without throwing (useLocation crash regression)
 *  - Does not refetch a fresh credit cache on route changes
 *  - Hydrates initial balance from sessionStorage so deep-link / refresh paints
 *    the correct value without a loading flash
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act, cleanup } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useNavigate } from "react-router-dom";

// ---- Mocks -----------------------------------------------------------------

const fetchSpy = vi.fn();

const STABLE_USER = { id: "user-1" };
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: STABLE_USER }),
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
      rpc: () => Promise.resolve({ data: null, error: null }),
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

afterEach(() => { cleanup(); });

describe("CreditProvider", () => {
  it("mounts inside Router without throwing and renders balance", async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId("balance").textContent).toBe("42"));
    expect(fetchSpy).toHaveBeenCalled();
  });

  it("reuses a fresh cache on client-side route change", async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId("balance").textContent).toBe("42"));
    const before = fetchSpy.mock.calls.length;
    expect(before).toBeGreaterThan(0);
    await act(async () => { screen.getByTestId("go").click(); });
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
    expect(fetchSpy.mock.calls.length).toBe(before);
  });

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
