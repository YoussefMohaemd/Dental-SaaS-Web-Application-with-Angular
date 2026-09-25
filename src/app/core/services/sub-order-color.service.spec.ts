import { TestBed } from "@angular/core/testing";
import { SubOrderColorService } from "./sub-order-color.service";

describe("SubOrderColorService", () => {
  let service: SubOrderColorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SubOrderColorService);
  });

  it("returns deterministic colors for the same id", () => {
    expect(service.colorForSubOrderId("so-22")).toBe(
      service.colorForSubOrderId("so-22"),
    );
  });

  it("cycles through controlled palette for many ids", () => {
    const values = Array.from({ length: 40 }, (_, index) =>
      service.colorForSubOrderId(`so-${index + 1}`),
    );
    const unique = new Set(values);
    expect(unique.size).toBeGreaterThan(1);
    expect(unique.size).toBeLessThanOrEqual(8);
  });
});
