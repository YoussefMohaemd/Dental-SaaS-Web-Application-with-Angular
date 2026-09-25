import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideRouter } from "@angular/router";
import { OrdersComponent, compareOrderValues } from "./orders.component";
import { NavigationService } from "@core/services/navigation.service";

describe("OrdersComponent", () => {
  let component: OrdersComponent;
  let fixture: ComponentFixture<OrdersComponent>;

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

  it("should window pagination around the current page", () => {
    component.pageSize.set(10);
    component.page.set(1);
    const first = component.visiblePageNumbers();
    expect(first.length).toBeLessThanOrEqual(7);
    expect(first[0]).toBe(1);
    component.goToPage(9999);
    expect(component.page()).toBe(component.totalPages());
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
    component.clearAllFilters();
    expect(component.page()).toBe(1);
    expect(component.activeFilters()).toEqual([]);
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

  it("should export the filtered orders as CSV and support first/last pagination", () => {
    component.firstPage();
    expect(component.page()).toBe(1);
    component.lastPage();
    expect(component.page()).toBe(component.totalPages());
    expect(component.pageSizes).toEqual([10, 20, 30, 40, 50]);
  });

  it("should clamp pagination within valid bounds", () => {
    component.prevPage();
    expect(component.page()).toBe(1);
    component.nextPage();
    expect(component.page()).toBeLessThanOrEqual(component.totalPages());
  });

  it("should refresh the table state through the loading simulation", () => {
    component.simulateRefresh();
    expect(component.viewState()).toBe("loading");
    component.retryLoad();
    expect(component.viewState()).toBe("normal");
  });
});
