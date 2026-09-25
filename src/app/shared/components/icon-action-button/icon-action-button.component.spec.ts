import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { IconActionButtonComponent } from "./icon-action-button.component";

describe("IconActionButtonComponent", () => {
  let component: IconActionButtonComponent;
  let fixture: ComponentFixture<IconActionButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconActionButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IconActionButtonComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("iconSvg", "<svg></svg>");
    fixture.componentRef.setInput("ariaLabel", "Edit order");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should expose documented defaults", () => {
    expect(component.tone()).toBe("neutral");
    expect(component.size()).toBe("icon-sm");
    expect(component.disabled()).toBe(false);
    expect(component.title()).toBe("");
  });

  it("should apply the aria-label to the underlying button", () => {
    const button = fixture.debugElement.query(By.css("button"));
    expect(button.nativeElement.getAttribute("aria-label")).toBe(
      "Edit order",
    );
  });

  it("should fall back the title to the aria-label", () => {
    const button = fixture.debugElement.query(By.css("button"));
    expect(button.nativeElement.getAttribute("title")).toBe("Edit order");
  });

  it("should prefer an explicit title over the aria-label", () => {
    fixture.componentRef.setInput("title", "Edit");
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css("button"));
    expect(button.nativeElement.getAttribute("title")).toBe("Edit");
  });

  it("should mark the icon container as decorative", () => {
    const icon = fixture.debugElement.query(By.css(".icon-action-svg"));
    expect(icon).toBeTruthy();
    expect(icon.nativeElement.getAttribute("aria-hidden")).toBe("true");
  });

  it("should apply tone-based classes", () => {
    fixture.componentRef.setInput("tone", "danger");
    fixture.detectChanges();
    expect(component.mergedButtonClass()).toContain("!text-danger");
    const button = fixture.debugElement.query(By.css("button"));
    expect(button.nativeElement.className).toContain("!text-danger");
  });

  it("should apply the default icon-sm sizing", () => {
    const button = fixture.debugElement.query(By.css("button"));
    expect(button.nativeElement.className).toContain("min-h-7");
  });

  it("should disable the underlying button", () => {
    fixture.componentRef.setInput("disabled", true);
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css("button"));
    expect(button.nativeElement.disabled).toBe(true);
    expect(button.nativeElement.getAttribute("aria-disabled")).toBe("true");
    expect(component.mergedButtonClass()).toContain("opacity-45");
  });

  it("should emit actionClick with the mouse event", () => {
    spyOn(component.actionClick, "emit");
    const host = fixture.debugElement.query(By.css("app-button"));
    const event = new MouseEvent("click");
    host.triggerEventHandler("onClick", event);
    expect(component.actionClick.emit).toHaveBeenCalledWith(event);
  });

  it("should reflect aria-expanded when provided", () => {
    fixture.componentRef.setInput("ariaExpanded", true);
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css("button"));
    expect(button.nativeElement.getAttribute("aria-expanded")).toBe("true");

    fixture.componentRef.setInput("ariaExpanded", null);
    fixture.detectChanges();
    expect(
      fixture.debugElement
        .query(By.css("button"))
        .nativeElement.getAttribute("aria-expanded"),
    ).toBeNull();
  });
});
