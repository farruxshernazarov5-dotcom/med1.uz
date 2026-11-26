import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePaymentLegalGate } from "./usePaymentLegalGate";

const { accept, paid } = vi.hoisted(() => ({ accept: vi.fn(), paid: vi.fn() }));
vi.mock("@/hooks/useLegalAcceptance", () => ({ useLegalAcceptance: () => ({ accept }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function Checkout() {
  const { requestLegal, legalModal } = usePaymentLegalGate("test_purchase");
  return <>{legalModal}<Button onClick={async () => { if (await requestLegal()) paid(); }}>To‘lash</Button></>;
}
const open = () => fireEvent.click(screen.getByRole("button", { name: "To‘lash" }));
const checkAll = () => screen.getAllByRole("checkbox").forEach(check => fireEvent.click(check));

beforeEach(() => { accept.mockReset().mockResolvedValue(true); paid.mockReset(); });
afterEach(cleanup);

describe("Every paid attempt requires three fresh consents", () => {
  it("does not pay before all three are checked and saved", async () => {
    render(<MemoryRouter><Checkout /></MemoryRouter>);
    open();
    const checks = screen.getAllByRole("checkbox");
    fireEvent.click(checks[0]); fireEvent.click(checks[1]);
    expect(screen.getByRole("button", { name: "Qabul qilaman" })).toBeDisabled();
    expect(paid).not.toHaveBeenCalled();
    fireEvent.click(checks[2]);
    fireEvent.click(screen.getByRole("button", { name: "Qabul qilaman" }));
    await waitFor(() => expect(paid).toHaveBeenCalledTimes(1));
    expect(accept.mock.calls).toEqual([
      ["saas_terms", "test_purchase"], ["privacy", "test_purchase"], ["disclaimer", "test_purchase"],
    ]);
  });

  it("requires fresh checks on the next payment, even after previous acceptance", async () => {
    render(<MemoryRouter><Checkout /></MemoryRouter>);
    open(); checkAll(); fireEvent.click(screen.getByRole("button", { name: "Qabul qilaman" }));
    await waitFor(() => expect(paid).toHaveBeenCalledTimes(1));
    open();
    screen.getAllByRole("checkbox").forEach(check => expect(check).not.toBeChecked());
    expect(screen.getByRole("button", { name: "Qabul qilaman" })).toBeDisabled();
    expect(paid).toHaveBeenCalledTimes(1);
  });

  it("cancelling never starts payment", async () => {
    render(<MemoryRouter><Checkout /></MemoryRouter>);
    open(); checkAll(); fireEvent.click(screen.getByRole("button", { name: "Bekor qilish" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(accept).not.toHaveBeenCalled(); expect(paid).not.toHaveBeenCalled();
  });

  it("a failed consent write keeps checkout blocked", async () => {
    accept.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    render(<MemoryRouter><Checkout /></MemoryRouter>);
    open(); checkAll(); fireEvent.click(screen.getByRole("button", { name: "Qabul qilaman" }));
    await waitFor(() => expect(accept).toHaveBeenCalledTimes(2));
    expect(screen.getByRole("dialog")).toBeInTheDocument(); expect(paid).not.toHaveBeenCalled();
  });
});