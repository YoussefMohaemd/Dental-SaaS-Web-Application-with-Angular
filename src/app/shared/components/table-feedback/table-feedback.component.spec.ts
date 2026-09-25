import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { TableFeedbackComponent } from "./table-feedback.component";

describe("TableFeedbackComponent", () => {
  let component: TableFeedbackComponent;
  let fixture: ComponentFixture<TableFeedbackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableFeedbackComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TableFeedbackComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("message", "No orders found");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should default to empty mode", () => {
    expect(component.mode()).toBe("empty");
  });

  it("should render the required message", () => {
    const message = fixture.debugElement.query(
      By.css(".enterprise-empty-state p"),
    );
    expect(message.nativeElement.textContent.trim()).toBe("No orders found");
  });

  it("should apply the default container classes", () => {
    const container = fixture.debugElement.query(
      By.css(".enterprise-empty-state"),
    );
    expect(container.nativeElement).toHaveClass("flex-col");
    expect(container.nativeElement).toHaveClass("text-center");
  });

  it("should allow overriding the container classes", () => {
    fixture.componentRef.setInput("containerClass", "custom-feedback");
    fixture.detectChanges();
    const container = fixture.debugElement.query(By.css("div"));
    expect(container.nativeElement).toHaveClass("custom-feedback");
  });

  it("should hide the icon when no iconSvg is provided", () => {
    const icon = fixture.debugElement.query(By.css("span[aria-hidden]"));
    expect(icon).toBeNull();
  });

  it("should render an aria-hidden icon when iconSvg is provided", () => {
    fixture.componentRef.setInput("iconSvg", "<svg></svg>");
    fixture.detectChanges();
    const icon = fixture.debugElement.query(By.css("span[aria-hidden]"));
    expect(icon).toBeTruthy();
    expect(icon.nativeElement.getAttribute("aria-hidden")).toBe("true");
  });

  it("should add animate-spin only when spin is enabled", () => {
    fixture.componentRef.setInput("iconSvg", "<svg></svg>");
    fixture.componentRef.setInput("spin", true);
    expect(component.computedIconClass()).toContain("animate-spin");

    fixture.componentRef.setInput("spin", false);
    expect(component.computedIconClass()).not.toContain("animate-spin");
  });

  it("should expose loading mode for table loading states", () => {
    fixture.componentRef.setInput("mode", "loading");
    fixture.componentRef.setInput("message", "Loading orders...");
    fixture.detectChanges();
    const message = fixture.debugElement.query(By.css("p"));
    expect(message.nativeElement.textContent.trim()).toBe("Loading orders...");
    expect(component.mode()).toBe("loading");
  });
});
