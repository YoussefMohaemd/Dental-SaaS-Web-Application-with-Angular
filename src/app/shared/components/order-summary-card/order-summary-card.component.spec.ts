import { ComponentFixture, TestBed } from "@angular/core/testing";
import { OrderSummaryCardComponent } from "./order-summary-card.component";

describe("OrderSummaryCardComponent", () => {
  let fixture: ComponentFixture<OrderSummaryCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderSummaryCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderSummaryCardComponent);
    fixture.componentRef.setInput("order", {
      id: "ord-1",
      orderNumber: "DL-024001",
    } as never);
    fixture.componentRef.setInput("completedServices", 3);
    fixture.componentRef.setInput("totalServices", 5);
    fixture.componentRef.setInput("currentStage", 1);
    fixture.componentRef.setInput("stages", ["Received", "Scanning", "Design"]);
    fixture.detectChanges();
  });

  it("renders the progress summary", () => {
    expect(fixture.nativeElement.textContent).toContain("3 of 5");
  });
});
