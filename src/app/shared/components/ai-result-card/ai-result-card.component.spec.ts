import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { AiResultCardComponent } from "./ai-result-card.component";
import { AiResultCard } from "@core/interfaces";

describe("AiResultCardComponent", () => {
  let component: AiResultCardComponent;
  let fixture: ComponentFixture<AiResultCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiResultCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AiResultCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("result", {
      id: "summary-1",
      title: "Orders Summary",
      summary: "3 overdue orders detected",
      tone: "success",
      ctaLabel: "Open Orders",
      ctaIntent: "openOrders",
    } satisfies AiResultCard);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render content and tone class", () => {
    expect(fixture.nativeElement.textContent).toContain("Orders Summary");
    expect(component.toneClass()).toContain("ai-result-card--success");
  });

  it("should emit result action when CTA is clicked", () => {
    spyOn(component.resultAction, "emit");
    const cta = fixture.debugElement.query(By.css("app-button"));
    cta.triggerEventHandler("onClick", new MouseEvent("click"));
    expect(component.resultAction.emit).toHaveBeenCalledWith(component.result());
  });

  it("should hide CTA when no call-to-action exists", () => {
    fixture.componentRef.setInput("result", {
      id: "summary-2",
      title: "Workflow Snapshot",
      summary: "No issues found",
      tone: "info",
    } satisfies AiResultCard);
    fixture.detectChanges();

    const cta = fixture.debugElement.query(By.css("[data-testid='result-cta']"));
    expect(cta).toBeNull();
  });

  it("should hide CTA when label exists without intent", () => {
    fixture.componentRef.setInput("result", {
      id: "summary-3",
      title: "Needs mapping",
      summary: "Label without intent should not render CTA",
      tone: "warning",
      ctaLabel: "Broken CTA",
    } as any);
    fixture.detectChanges();

    const cta = fixture.debugElement.query(By.css("[data-testid='result-cta']"));
    expect(cta).toBeNull();
  });
});
