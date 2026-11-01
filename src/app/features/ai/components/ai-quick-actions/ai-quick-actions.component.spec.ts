import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { AiQuickActionsComponent } from "./ai-quick-actions.component";

describe("AiQuickActionsComponent", () => {
  let component: AiQuickActionsComponent;
  let fixture: ComponentFixture<AiQuickActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiQuickActionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AiQuickActionsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("actions", [
      {
        id: "qa-services",
        title: "Services",
        description: "List services",
        intent: "aboutCompany",
        prompt: "show services",
      },
    ]);
    fixture.componentRef.setInput("disabled", false);
    fixture.detectChanges();
  });

  it("should render quick action card", () => {
    expect(fixture.debugElement.query(By.css("[data-testid='quick-action']"))).toBeTruthy();
  });

  it("should emit selected quick action", () => {
    spyOn(component.actionInvoked, "emit");
    const firstAction = component.actions()[0];
    component.onActionSelected(firstAction);

    expect(component.actionInvoked.emit).toHaveBeenCalledWith(firstAction);
  });
});
