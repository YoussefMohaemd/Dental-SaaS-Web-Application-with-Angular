import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from "@angular/router";
import { of } from "rxjs";
import { OrderWorkflowComponent } from "./order-workflow.component";

describe("OrderWorkflowComponent", () => {
  let component: OrderWorkflowComponent;
  let fixture: ComponentFixture<OrderWorkflowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderWorkflowComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ orderId: "missing-order" }),
            },
            paramMap: of(convertToParamMap({ orderId: "missing-order" })),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderWorkflowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should expose seven workflow stages", () => {
    expect(component.stages.length).toBe(7);
  });

  it("should classify stage states relative to current index", () => {
    const current = component.currentIndex();
    expect(component.isStageCurrent(current)).toBeTrue();
    if (current > 0) expect(component.isStageDone(0)).toBeTrue();
  });

  it("should expose an explicit not-found state for invalid ids", () => {
    expect(component.order()).toBeUndefined();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("No order found");
  });
});
