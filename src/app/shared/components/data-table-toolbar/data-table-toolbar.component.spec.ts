import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { DataTableToolbarComponent } from "./data-table-toolbar.component";

@Component({
  standalone: true,
  imports: [DataTableToolbarComponent],
  template: `
    <app-data-table-toolbar title="Orders" subtitle="Manage and track orders">
      <button type="button" header-actions>Export</button>
    </app-data-table-toolbar>

    <app-data-table-toolbar title="Doctors" />
  `,
})
class ToolbarHostComponent {}

describe("DataTableToolbarComponent", () => {
  let component: DataTableToolbarComponent;
  let fixture: ComponentFixture<DataTableToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataTableToolbarComponent, ToolbarHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DataTableToolbarComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("title", "Orders");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render the title as the page heading", () => {
    fixture.componentRef.setInput("title", "Patients");
    fixture.detectChanges();
    const heading = fixture.debugElement.query(By.css("h1"));
    expect(heading.nativeElement.textContent.trim()).toBe("Patients");
    expect(heading.nativeElement).toHaveClass("font-display");
  });

  it("should render the subtitle when provided", () => {
    fixture.componentRef.setInput("subtitle", "Manage and track orders");
    fixture.detectChanges();
    const subtitle = fixture.debugElement.query(By.css("p"));
    expect(subtitle.nativeElement.textContent.trim()).toBe(
      "Manage and track orders",
    );
  });

  it("should omit the subtitle element when empty", () => {
    const subtitle = fixture.debugElement.query(By.css("p"));
    expect(subtitle).toBeNull();
  });

  it("should require a title (typed required API)", () => {
    expect(() => component.title()).not.toThrow();
    fixture.componentRef.setInput("title", "");
    fixture.detectChanges();
    const heading = fixture.debugElement.query(By.css("h1"));
    expect(heading.nativeElement.textContent.trim()).toBe("");
  });

  it("should project header actions and support a subtitle-less instance via a host", () => {
    const hostFixture = TestBed.createComponent(ToolbarHostComponent);
    hostFixture.detectChanges();

    const action = hostFixture.debugElement.query(By.css("[header-actions]"));
    expect(action.nativeElement.textContent).toContain("Export");

    const headings = hostFixture.debugElement.queryAll(By.css("h1"));
    expect(headings.length).toBe(2);
    expect(headings[1].nativeElement.textContent.trim()).toBe("Doctors");

    const subtitles = hostFixture.debugElement.queryAll(
      By.css(".enterprise-header-copy p"),
    );
    expect(subtitles.length).toBe(1);
  });
});
