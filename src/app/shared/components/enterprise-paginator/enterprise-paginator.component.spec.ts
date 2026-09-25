import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { PaginatorState } from "primeng/paginator";
import { EnterprisePaginatorComponent } from "./enterprise-paginator.component";

describe("EnterprisePaginatorComponent", () => {
  let component: EnterprisePaginatorComponent;
  let fixture: ComponentFixture<EnterprisePaginatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnterprisePaginatorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EnterprisePaginatorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("totalRecords", 25);
    fixture.componentRef.setInput("rows", 10);
    fixture.componentRef.setInput("page", 1);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should compute the visible range for the first page", () => {
    expect(component.firstRecord()).toBe(0);
    expect(component.rangeStart()).toBe(1);
    expect(component.rangeEnd()).toBe(10);
  });

  it("should clamp the range to totalRecords on the last page", () => {
    fixture.componentRef.setInput("page", 3);
    fixture.detectChanges();
    expect(component.firstRecord()).toBe(20);
    expect(component.rangeStart()).toBe(21);
    expect(component.rangeEnd()).toBe(25);
  });

  it("should expose a zeroed range when there are no records", () => {
    fixture.componentRef.setInput("totalRecords", 0);
    fixture.detectChanges();
    expect(component.rangeStart()).toBe(0);
    expect(component.rangeEnd()).toBe(0);
    const summary = fixture.debugElement.query(
      By.css(".enterprise-pagination span"),
    );
    expect(summary.nativeElement.textContent).toContain("of 0");
  });

  it("should render the range summary for the current page", () => {
    const summary = fixture.debugElement.query(
      By.css(".enterprise-pagination span"),
    );
    expect(summary.nativeElement.textContent).toContain("of 25");
    expect(summary.nativeElement.textContent).toContain("1");
  });

  it("should emit the 1-based page number from PrimeNG page changes", () => {
    spyOn(component.pageChange, "emit");
    component.onPrimePageChange({ first: 10, rows: 10 } as PaginatorState);
    expect(component.pageChange.emit).toHaveBeenCalledWith(2);
  });

  it("should emit the last page for the final window", () => {
    spyOn(component.pageChange, "emit");
    component.onPrimePageChange({ first: 20, rows: 10 } as PaginatorState);
    expect(component.pageChange.emit).toHaveBeenCalledWith(3);
  });

  it("should fall back to defaults when PrimeNG sends an empty state", () => {
    spyOn(component.pageChange, "emit");
    component.onPrimePageChange({} as PaginatorState);
    expect(component.pageChange.emit).toHaveBeenCalledWith(1);
  });

  it("should forward p-paginator onPageChange events", () => {
    spyOn(component.pageChange, "emit");
    const paginator = fixture.debugElement.query(By.css("p-paginator"));
    expect(paginator).toBeTruthy();
    paginator.triggerEventHandler("onPageChange", {
      first: 10,
      rows: 10,
    } as PaginatorState);
    expect(component.pageChange.emit).toHaveBeenCalledWith(2);
  });

  it("should bind pagination inputs to the PrimeNG paginator", () => {
    fixture.componentRef.setInput("pageLinkSize", 7);
    fixture.detectChanges();
    const paginator = fixture.debugElement.query(By.css("p-paginator"));
    expect(paginator.componentInstance.totalRecords).toBe(25);
    expect(paginator.componentInstance.rows).toBe(10);
    expect(paginator.componentInstance.pageLinkSize).toBe(7);
  });
});
