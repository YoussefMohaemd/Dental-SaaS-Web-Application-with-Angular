import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { EmptyStateComponent } from "./empty-state.component";

describe("EmptyStateComponent", () => {
  let component: EmptyStateComponent;
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display default title and description", () => {
    const title = fixture.debugElement.query(By.css(".empty-state-title"));
    const desc = fixture.debugElement.query(By.css(".empty-state-description"));
    expect(title.nativeElement.textContent.trim()).toBe("No data found");
    expect(desc.nativeElement.textContent.trim()).toBe(
      "Try adjusting your search or filters.",
    );
  });

  it("should display custom title and description", () => {
    fixture.componentRef.setInput("title", "No orders");
    fixture.componentRef.setInput("description", "Create your first order");
    fixture.detectChanges();
    const title = fixture.debugElement.query(By.css(".empty-state-title"));
    const desc = fixture.debugElement.query(By.css(".empty-state-description"));
    expect(title.nativeElement.textContent.trim()).toBe("No orders");
    expect(desc.nativeElement.textContent.trim()).toBe(
      "Create your first order",
    );
  });

  it("should display action button when actionLabel is provided", () => {
    fixture.componentRef.setInput("actionLabel", "Create Order");
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css("app-button"));
    expect(button).toBeTruthy();
  });

  it("should not display action button when actionLabel is empty", () => {
    fixture.componentRef.setInput("actionLabel", "");
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css("app-button"));
    expect(button).toBeFalsy();
  });

  it("should emit actionClick when button clicked", () => {
    spyOn(component.actionClick, "emit");
    fixture.componentRef.setInput("actionLabel", "Create Order");
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css("app-button"));
    button.triggerEventHandler("onClick", new MouseEvent("click"));
    expect(component.actionClick.emit).toHaveBeenCalled();
  });
});
