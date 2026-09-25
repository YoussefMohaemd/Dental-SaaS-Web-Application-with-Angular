import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { SearchFilterToolbarComponent } from "./search-filter-toolbar.component";

@Component({
  standalone: true,
  imports: [SearchFilterToolbarComponent],
  template: `
    <app-search-filter-toolbar
      searchId="toolbar-search"
      selectId="toolbar-status"
      actionLabel="New Order"
      actionAriaLabel="Create order"
      [selectOptions]="['Active', 'Completed']"
      (searchValueChange)="search = $event"
      (selectValueChange)="selected = $event"
      (actionClick)="actions = actions + 1"
    >
      <div toolbar-extra-filters>extra filters</div>
      <button type="button" toolbar-extra-actions>Export</button>
    </app-search-filter-toolbar>
  `,
})
class ToolbarHostComponent {
  search = "";
  selected = "";
  actions = 0;
}

describe("SearchFilterToolbarComponent", () => {
  let component: SearchFilterToolbarComponent;
  let fixture: ComponentFixture<SearchFilterToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchFilterToolbarComponent, ToolbarHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchFilterToolbarComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("searchId", "search");
    fixture.componentRef.setInput("selectId", "filter");
    fixture.componentRef.setInput("actionLabel", "Create");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should expose documented defaults for optional configuration", () => {
    expect(component.searchPlaceholder()).toBe("Search...");
    expect(component.selectPlaceholder()).toBe("All");
    expect(component.selectOptions()).toEqual([]);
    expect(component.actionDisabled()).toBe(false);
    expect(component.actionAriaLabel()).toBe("");
  });

  it("should emit searchValueChange when the search input changes", () => {
    spyOn(component.searchValueChange, "emit");
    const input = fixture.debugElement.query(By.css("app-input"));
    input.triggerEventHandler("valueChange", "ord-1");
    expect(component.searchValueChange.emit).toHaveBeenCalledWith("ord-1");
  });

  it("should emit selectValueChange when the filter select changes", () => {
    spyOn(component.selectValueChange, "emit");
    const select = fixture.debugElement.query(By.css("app-select"));
    select.triggerEventHandler("valueChange", "Active");
    expect(component.selectValueChange.emit).toHaveBeenCalledWith("Active");
  });

  it("should emit actionClick when the action button is clicked", () => {
    spyOn(component.actionClick, "emit");
    const button = fixture.debugElement.query(By.css("app-button"));
    button.triggerEventHandler("onClick", new MouseEvent("click"));
    expect(component.actionClick.emit).toHaveBeenCalled();
  });

  it("should not emit actionClick while the action is disabled", () => {
    fixture.componentRef.setInput("actionDisabled", true);
    fixture.detectChanges();
    spyOn(component.actionClick, "emit");

    component.onActionClick();
    expect(component.actionClick.emit).not.toHaveBeenCalled();

    const button = fixture.debugElement.query(By.css("app-button button"));
    expect(button.nativeElement.disabled).toBe(true);
  });

  it("should forward the action aria-label to the underlying button", () => {
    fixture.componentRef.setInput("actionAriaLabel", "Create order");
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css("app-button button"));
    expect(button.nativeElement.getAttribute("aria-label")).toBe(
      "Create order",
    );
  });

  it("should omit the aria-label when none is provided", () => {
    const button = fixture.debugElement.query(By.css("app-button button"));
    expect(button.nativeElement.getAttribute("aria-label")).toBeNull();
  });

  it("should render the action label and hide it from small screens", () => {
    const label = fixture.debugElement.query(
      By.css("app-button span.hidden.sm\\:inline"),
    );
    expect(label).toBeTruthy();
    expect(label.nativeElement.textContent.trim()).toBe("Create");
  });

  it("should project extra filter and action slots (composite structure)", () => {
    const hostFixture = TestBed.createComponent(ToolbarHostComponent);
    hostFixture.detectChanges();
    const extraFilters = hostFixture.debugElement.query(
      By.css("[toolbar-extra-filters]"),
    );
    const extraActions = hostFixture.debugElement.query(
      By.css("[toolbar-extra-actions]"),
    );
    expect(extraFilters.nativeElement.textContent).toContain("extra filters");
    expect(extraActions.nativeElement.textContent).toContain("Export");
  });

  it("should wire search, filter and action through a host page", () => {
    const hostFixture = TestBed.createComponent(ToolbarHostComponent);
    hostFixture.detectChanges();
    const host = hostFixture.componentInstance;

    hostFixture.debugElement
      .query(By.css("app-input"))
      .triggerEventHandler("valueChange", "ord-9");
    hostFixture.debugElement
      .query(By.css("app-select"))
      .triggerEventHandler("valueChange", "Completed");
    hostFixture.debugElement
      .query(By.css("app-button"))
      .triggerEventHandler("onClick", new MouseEvent("click"));
    hostFixture.detectChanges();

    expect(host.search).toBe("ord-9");
    expect(host.selected).toBe("Completed");
    expect(host.actions).toBe(1);
  });
});
