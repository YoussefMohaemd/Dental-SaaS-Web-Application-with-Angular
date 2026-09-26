import { ComponentFixture, TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideRouter } from "@angular/router";
import { BillingComponent } from "./billing.component";
import { BillingDataService } from "@core/services/billing-data.service";
import { BillingRecord } from "@core/models";

describe("BillingComponent", () => {
  let component: BillingComponent;
  let fixture: ComponentFixture<BillingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillingComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BillingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should toggle sort direction on the same column", () => {
    component.toggleSort("amount");
    expect(component.sortColumn()).toBe("amount");
    const direction = component.sortDirection();
    component.toggleSort("amount");
    expect(component.sortDirection()).toBe(
      direction === "asc" ? "desc" : "asc",
    );
  });

  it("should reset to page 1 when filters change", () => {
    component.page.set(3);
    component.onStatusChange({ target: { value: "Paid" } } as unknown as Event);
    expect(component.page()).toBe(1);
    expect(component.statusFilter()).toBe("Paid");
  });
});

describe("BillingComponent sortable headers a11y", () => {
  let component: BillingComponent;
  let fixture: ComponentFixture<BillingComponent>;

  const record: BillingRecord = {
    id: "b-1",
    orderId: "o-1",
    orderNumber: "ORD-1001",
    patientName: "Jane Doe",
    doctorName: "Dr. Smith",
    clinicName: "Bright Smile Dental",
    amount: 150,
    status: "Pending",
    dueDate: "2025-03-01",
    vouchers: 0,
    notes: "",
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillingComponent],
      providers: [
        provideRouter([]),
        {
          provide: BillingDataService,
          useValue: {
            records: signal([record]),
            loading: signal(false),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BillingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should render sortable header buttons with scope and aria-label", () => {
    const sortHeaders = Array.from(
      fixture.nativeElement.querySelectorAll("th[aria-sort]"),
    ) as HTMLElement[];
    expect(sortHeaders.length).toBe(5);

    sortHeaders.forEach((th) => {
      expect(th.getAttribute("scope")).toBe("col");
      const button = th.querySelector("button.billing-sort-button");
      expect(button).toBeTruthy();
      expect(button?.getAttribute("aria-label")).toContain("Sort by");
    });
  });

  it("should expose aria-sort matching the active sort column", () => {
    const headers = Array.from(
      fixture.nativeElement.querySelectorAll("th[aria-sort]"),
    ) as HTMLElement[];
    const byLabel = (label: string): HTMLElement | undefined =>
      headers.find(
        (th) =>
          th.querySelector("button")?.getAttribute("aria-label") === label,
      );

    expect(
      byLabel("Sort by Due Date, currently descending")?.getAttribute(
        "aria-sort",
      ),
    ).toBe("descending");
    expect(
      byLabel("Sort by Amount, currently unsorted")?.getAttribute("aria-sort"),
    ).toBe("none");
  });

  it("should toggle aria-sort when the header button is activated", () => {
    const amountHeader = (
      Array.from(
        fixture.nativeElement.querySelectorAll("th[aria-sort]"),
      ) as HTMLElement[]
    ).find(
      (th) =>
        th.querySelector("button")?.getAttribute("aria-label") ===
        "Sort by Amount, currently unsorted",
    ) as HTMLElement;

    amountHeader.querySelector("button")?.click();
    fixture.detectChanges();

    expect(component.sortColumn()).toBe("amount");
    expect(amountHeader.getAttribute("aria-sort")).toBe("ascending");
    expect(component.sortDirection()).toBe("asc");
  });
});
