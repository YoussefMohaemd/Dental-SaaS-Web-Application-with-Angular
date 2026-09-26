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
      patientId: "pt-1",
      patientName: "Alice Johnson",
      doctorId: "dr-1",
      doctorName: "Dr. Park",
      clinicId: "cl-1",
      clinicName: "Bright Smile Dental",
      scanCenterId: "scan-1",
      scanCenterName: "Main Scan Center",
      status: "New",
      priority: "Normal",
      restoration: "Crown",
      arch: "Maxilla",
      format: "STL",
      shade: "A2",
      units: 1,
      amount: 250,
      billed: false,
      vouchers: 0,
      billTo: "Bright Smile Dental",
      isLocked: false,
      hasNotes: false,
      notes: "",
      receivedAt: "2026-09-26T10:00:00.000Z",
      updatedAt: "2026-09-26T10:00:00.000Z",
      dueDate: "2026-10-01",
    } as never);
    fixture.componentRef.setInput("completedServices", 3);
    fixture.componentRef.setInput("totalServices", 5);
    fixture.detectChanges();
  });

  it("should render the order number", () => {
    expect(fixture.nativeElement.textContent).toContain("DL-024001");
  });

  it("should render the service progress summary", () => {
    expect(fixture.nativeElement.textContent).toContain("3 of 5");
  });

  it("should render the no-progress fallback when no services are completed", () => {
    fixture.componentRef.setInput("completedServices", 0);
    fixture.componentRef.setInput("totalServices", 5);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      "No services completed yet",
    );
  });
});
