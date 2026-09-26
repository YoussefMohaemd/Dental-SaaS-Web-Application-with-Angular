import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { AppButtonComponent } from "./button.component";

@Component({
  standalone: true,
  imports: [AppButtonComponent],
  template: `<app-button variant="primary">Sign in</app-button>`,
})
class ProjectionHostComponent {}

describe("AppButtonComponent", () => {
  let component: AppButtonComponent;
  let fixture: ComponentFixture<AppButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppButtonComponent, ProjectionHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AppButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render primary button by default", () => {
    const button = fixture.debugElement.query(By.css("button"));
    expect(button.nativeElement).toHaveClass("bg-primary");
  });

  it("should match React parity: rounded-lg radius and semibold weight", () => {
    const button = fixture.debugElement.query(By.css("button"));
    expect(button.nativeElement).toHaveClass("rounded-lg");
    expect(button.nativeElement).toHaveClass("font-semibold");
  });

  it("should apply variant classes", () => {
    fixture.componentRef.setInput("variant", "danger");
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css("button"));
    expect(button.nativeElement).toHaveClass("bg-danger");
  });

  it("should apply size classes", () => {
    fixture.componentRef.setInput("size", "lg");
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css("button"));
    expect(button.nativeElement).toHaveClass("px-4");
  });

  it("should be disabled when disabled input is true", () => {
    fixture.componentRef.setInput("disabled", true);
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css("button"));
    expect(button.nativeElement.disabled).toBe(true);
    expect(button.nativeElement.className).toContain(
      "disabled:opacity-[var(--disabled-opacity)]",
    );
    expect(button.nativeElement.getAttribute("aria-disabled")).toBe("true");
  });

  it("should disable and expose aria-busy when loading", () => {
    fixture.componentRef.setInput("loading", true);
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css("button"));
    const spinner = fixture.debugElement.query(By.css(".loading-spinner"));
    expect(spinner).toBeTruthy();
    expect(button.nativeElement.disabled).toBe(true);
    expect(button.nativeElement.getAttribute("aria-busy")).toBe("true");
  });

  it("should emit click event", () => {
    spyOn(component.onClick, "emit");
    const button = fixture.debugElement.query(By.css("button"));
    button.triggerEventHandler("click", new MouseEvent("click"));
    expect(component.onClick.emit).toHaveBeenCalled();
  });

  it("should not emit when disabled (button variant)", () => {
    fixture.componentRef.setInput("disabled", true);
    fixture.detectChanges();
    spyOn(component.onClick, "emit");
    component.handleClick(new MouseEvent("click"));
    expect(component.onClick.emit).not.toHaveBeenCalled();
  });

  it("should not emit when loading", () => {
    fixture.componentRef.setInput("loading", true);
    fixture.detectChanges();
    spyOn(component.onClick, "emit");
    const event = new MouseEvent("click");
    spyOn(event, "preventDefault");
    component.handleClick(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.onClick.emit).not.toHaveBeenCalled();
  });

  it("should project light-DOM content into the native button (single catch-all outlet)", async () => {
    const hostFixture = TestBed.createComponent(ProjectionHostComponent);
    hostFixture.detectChanges();
    const button = hostFixture.debugElement.query(By.css("app-button button"));
    expect(button).toBeTruthy();
    expect(button.nativeElement.textContent).toContain("Sign in");
  });

  it("should expose focus-visible ring for keyboard users", () => {
    const button = fixture.debugElement.query(By.css("button"));
    expect(button.nativeElement.className).toContain("focus-visible:ring-2");
  });
});
