import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { AiShortcutCardComponent } from "./ai-shortcut-card.component";
import { AiShortcutAction } from "@core/interfaces";

describe("AiShortcutCardComponent", () => {
  let component: AiShortcutCardComponent;
  let fixture: ComponentFixture<AiShortcutCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiShortcutCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AiShortcutCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("action", {
      id: "generate-report",
      title: "Generate Report",
      intent: "generateReport",
      description: "Create a weekly summary",
    } satisfies AiShortcutAction);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should emit selected action when CTA is clicked", () => {
    spyOn(component.actionSelected, "emit");

    const button = fixture.debugElement.query(By.css("button"));
    button.triggerEventHandler("click", new MouseEvent("click"));

    expect(component.actionSelected.emit).toHaveBeenCalledWith(
      component.action(),
    );
  });

  it("should render action title when optional fields are missing", () => {
    fixture.componentRef.setInput("action", {
      id: "open-orders",
      title: "Open Orders",
      intent: "openOrders",
    } satisfies AiShortcutAction);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain("Open Orders");
  });

  it("should expose keyboard-accessible button semantics", () => {
    const button = fixture.debugElement.query(By.css("button"));
    expect(button.nativeElement.getAttribute("type")).toBe("button");
  });
});
