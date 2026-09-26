import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideRouter } from "@angular/router";
import { OrdersComponent, compareOrderValues } from "./orders.component";
import { NavigationService } from "@core/services/navigation.service";
import { OrderDataService } from "@core/services/order-data.service";

describe("OrdersComponent", () => {
  let component: OrdersComponent;
  let fixture: ComponentFixture<OrdersComponent>;
  let orderService: OrderDataService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdersComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrdersComponent);
    component = fixture.componentInstance;
    orderService = TestBed.inject(OrderDataService);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should toggle sorting on the same column", () => {
    component.toggleSort("amount");
    expect(component.sortColumn()).toBe("amount");
    expect(component.sortDirection()).toBe("asc");
    component.toggleSort("amount");
    expect(component.sortDirection()).toBe("desc");
  });

  it("should compare numbers numerically (not lexicographically)", () => {
    expect(compareOrderValues(9, 80)).toBeLessThan(0);
    expect(compareOrderValues(100, 20)).toBeGreaterThan(0);
    expect(compareOrderValues(42, 42)).toBe(0);
  });

  it("should compare ISO dates chronologically", () => {
    expect(compareOrderValues("2024-01-02", "2024-03-01")).toBeLessThan(0);
    expect(compareOrderValues("2024-12-01", "2024-03-01")).toBeGreaterThan(0);
  });

  it("should compare strings with localeCompare fallback", () => {
    expect(compareOrderValues("b", "a")).toBeGreaterThan(0);
    expect(compareOrderValues(null, "a")).toBeLessThan(0);
  });

  it("should expose aria-sort state per column", () => {
    component.sortColumn.set("amount");
    component.sortDirection.set("asc");
    expect(component.sortAriaSort("amount")).toBe("ascending");
    expect(component.sortAriaSort("status")).toBe("none");
    expect(component.sortAriaLabel("amount")).toContain("ascending");
  });

  it("should use human-readable labels in sort aria-labels", () => {
    component.sortColumn.set("orderNumber");
    component.sortDirection.set("desc");
    expect(component.sortAriaLabel("orderNumber")).toBe(
      "Sort by Order number, currently descending",
    );
    expect(component.sortAriaLabel("status")).toBe(
      "Sort by Status, currently unsorted",
    );
  });

  it("should render SVG sort indicators with distinct unsorted/active states", () => {
    component.sortColumn.set("receivedAt");
    component.sortDirection.set("desc");
    const unsorted = component.sortIconSvg("status");
    const active = component.sortIconSvg("receivedAt");
    expect(unsorted).toContain("<svg");
    expect(active).toContain("<svg");
    expect(unsorted).not.toBe(active);
    component.sortDirection.set("asc");
    expect(component.sortIconSvg("receivedAt")).not.toBe(active);
  });

  it("should manage multi-select status filters", () => {
    component.addStatusFilter("New");
    component.addStatusFilter("New");
    expect(component.statusFilter()).toEqual(["New"]);
    component.removeFilter("status", "New");
    expect(component.statusFilter()).toEqual([]);
  });

  it("should toggle row selection", () => {
    component.toggleSelect("ord-1");
    expect(component.isSelected("ord-1")).toBeTrue();
    component.toggleSelect("ord-1");
    expect(component.isSelected("ord-1")).toBeFalse();
  });

  it("should clear all filters and reset pagination", () => {
    component.page.set(3);
    component.patientFilter.set("Alice Johnson");
    component.doctorFilter.set("Dr. Park");
    component.serviceFilter.set("Crown");
    component.clearAllFilters();
    expect(component.page()).toBe(1);
    expect(component.activeFilters()).toEqual([]);
    expect(component.patientFilter()).toBe("");
    expect(component.doctorFilter()).toBe("");
    expect(component.serviceFilter()).toBe("");
  });

  it("should remove patient, doctor, and service filters individually", () => {
    component.patientFilter.set("Alice Johnson");
    component.doctorFilter.set("Dr. Park");
    component.serviceFilter.set("Crown");

    component.removeFilter("patient", "Alice Johnson");
    expect(component.patientFilter()).toBe("");

    component.removeFilter("doctor", "Dr. Park");
    expect(component.doctorFilter()).toBe("");

    component.removeFilter("service", "Crown");
    expect(component.serviceFilter()).toBe("");
  });

  it("should update search and reset pagination (immediate + debounced paths)", () => {
    component.page.set(3);
    component.onSearchInput("DL-024");
    expect(component.search()).toBe("DL-024");
    expect(component.page()).toBe(1);
    component.page.set(4);
    component.onDebouncedSearch("smith");
    expect(component.search()).toBe("smith");
    expect(component.page()).toBe(1);
    component.clearSearch();
    expect(component.search()).toBe("");
  });

  it("should expose Lucide-equivalent SVG icons for actions", () => {
    for (const name of [
      "plus",
      "download",
      "refresh",
      "lock",
      "unlock",
      "chevron-left",
      "chevron-right",
    ]) {
      expect(component.getIconSvg(name)).toContain("<svg");
    }
  });

  it("should navigate to createOrder when Create Order is invoked", () => {
    const nav = TestBed.inject(NavigationService);
    spyOn(nav, "navigate");
    component.createOrder();
    expect(nav.navigate).toHaveBeenCalledWith("createOrder");
  });

  it("should navigate to view order and related records", () => {
    const nav = TestBed.inject(NavigationService);
    spyOn(nav, "navigate");
    component.openOrder("ord-1");
    expect(nav.navigate).toHaveBeenCalledWith("viewOrder", {
      orderId: "ord-1",
    });
    component.openPatient("pt1");
    expect(nav.navigate).toHaveBeenCalledWith("patientDetails", {
      patientId: "pt1",
    });
    component.openDoctor("dr1");
    expect(nav.navigate).toHaveBeenCalledWith("doctorDetails", {
      doctorId: "dr1",
    });
  });

  it("should expose configured pagination size choices", () => {
    expect(component.pageSizes).toEqual([10, 20, 30, 40, 50]);
  });

  it("should clamp pagination within valid bounds", () => {
    component.goToPage(0);
    expect(component.page()).toBe(1);
    component.goToPage(9999);
    expect(component.page()).toBe(component.totalPages());
  });

  it("should show the loading state while the service is loading", () => {
    orderService.previewState("loading");
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain("Loading orders...");
  });

  it("should show the error state when the service reports an error", () => {
    orderService.previewState("error");
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      "Failed to load orders",
    );
    expect(fixture.nativeElement.textContent).toContain("Try Again");
  });

  it("should reload orders on retry", () => {
    orderService.previewState("error");
    fixture.detectChanges();
    spyOn(orderService, "reload");

    const retryButton = Array.from(
      fixture.nativeElement.querySelectorAll(
        "button",
      ) as NodeListOf<HTMLButtonElement>,
    ).find((button) => button.textContent?.trim().includes("Try Again"));

    expect(retryButton).toBeDefined();
    retryButton?.click();
    expect(orderService.reload).toHaveBeenCalled();
  });

  it("should show the empty state when no orders are available", () => {
    orderService.previewState("empty");
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain("No orders yet");
  });

  it("should show the normal table when orders are loaded", () => {
    orderService.previewState("empty");
    orderService.createOrder({
      patientId: "pt-1",
      patientName: "Alice Johnson",
      doctorId: "dr-1",
      doctorName: "Dr. Park",
      clinicId: "cl-1",
      clinicName: "Bright Smile Dental",
      scanCenterId: "scan-1",
      scanCenterName: "Main Scan Center",
      status: "New",
      priority: "High",
      restoration: "Crown",
      arch: "Maxilla",
      format: "STL",
      shade: "A2",
      units: 2,
      amount: 500,
      billed: false,
      billTo: "Bright Smile Dental",
      vouchers: 0,
      isLocked: false,
      hasNotes: false,
      notes: "",
      dueDate: "2026-12-24",
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector("p-treetable")).toBeTruthy();
  });

  it("should render the shared data-table toolbar as the page header", () => {
    orderService.previewState("empty");
    orderService.createOrder({
      patientId: "pt-1",
      patientName: "Alice Johnson",
      doctorId: "dr-1",
      doctorName: "Dr. Park",
      clinicId: "cl-1",
      clinicName: "Bright Smile Dental",
      scanCenterId: "scan-1",
      scanCenterName: "Main Scan Center",
      status: "New",
      priority: "High",
      restoration: "Crown",
      arch: "Maxilla",
      format: "STL",
      shade: "A2",
      units: 2,
      amount: 500,
      billed: false,
      billTo: "Bright Smile Dental",
      vouchers: 0,
      isLocked: false,
      hasNotes: false,
      notes: "",
      dueDate: "2026-12-24",
    });
    fixture.detectChanges();

    const toolbars = fixture.nativeElement.querySelectorAll(
      "app-data-table-toolbar",
    );
    expect(toolbars.length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain("Orders");
  });

  it("should render a status badge with assistive semantics for every rendered row", () => {
    orderService.previewState("empty");
    orderService.createOrder({
      patientId: "pt-1",
      patientName: "Alice Johnson",
      doctorId: "dr-1",
      doctorName: "Dr. Park",
      clinicId: "cl-1",
      clinicName: "Bright Smile Dental",
      scanCenterId: "scan-1",
      scanCenterName: "Main Scan Center",
      status: "New",
      priority: "High",
      restoration: "Crown",
      arch: "Maxilla",
      format: "STL",
      shade: "A2",
      units: 2,
      amount: 500,
      billed: false,
      billTo: "Bright Smile Dental",
      vouchers: 0,
      isLocked: false,
      hasNotes: false,
      notes: "",
      dueDate: "2026-12-24",
    });
    fixture.detectChanges();

    const badges = Array.from(
      fixture.nativeElement.querySelectorAll("app-status-badge"),
    ) as HTMLElement[];
    expect(badges.length).toBeGreaterThan(0);
    badges.forEach((badge) => {
      expect(badge.querySelector('[role="status"]')).toBeTruthy();
    });
  });

  it("should render the shared empty state when filters match nothing", () => {
    orderService.previewState("empty");
    orderService.createOrder({
      patientId: "pt-1",
      patientName: "Alice Johnson",
      doctorId: "dr-1",
      doctorName: "Dr. Park",
      clinicId: "cl-1",
      clinicName: "Bright Smile Dental",
      scanCenterId: "scan-1",
      scanCenterName: "Main Scan Center",
      status: "New",
      priority: "High",
      restoration: "Crown",
      arch: "Maxilla",
      format: "STL",
      shade: "A2",
      units: 2,
      amount: 500,
      billed: false,
      billTo: "Bright Smile Dental",
      vouchers: 0,
      isLocked: false,
      hasNotes: false,
      notes: "",
      dueDate: "2026-12-24",
    });
    component.onSearchInput("zzz-no-match");
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector("app-empty-state")).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain("No matching orders");
  });
});
