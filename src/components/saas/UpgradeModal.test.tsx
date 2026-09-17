import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import UpgradeModal from "./UpgradeModal";

describe("UpgradeModal", () => {
  it.each(["lite", "standard", "premium"])(
    "handles the patient Med Coin tier %s without crashing",
    (currentTier) => {
      expect(() =>
        render(
          <MemoryRouter>
            <UpgradeModal
              open={false}
              onClose={() => undefined}
              moduleId="patient-dashboard"
              currentTier={currentTier}
            />
          </MemoryRouter>,
        ),
      ).not.toThrow();
    },
  );
});