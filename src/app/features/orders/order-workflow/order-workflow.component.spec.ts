import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import {
  ActivatedRoute,
  convertToParamMap,
  ParamMap,
  provideRouter,
} from "@angular/router";
import { BehaviorSubject, of } from "rxjs";
import { OrderWorkflowComponent } from "./order-workflow.component";
import { OrderDataService } from "@core/services/order-data.service";
import { Order } from "@core/interfaces";

const orderA = {
  id: "ord-a",
  orderNumber: "DL-000001",
  patientId: "pt-1",
  patientName: "Alice Johnson",
  status: "New",
  priority: "Normal",
  updatedAt: "2024-12-10T10:00:00Z",
} as Order;

const orderB = {
  id: "ord-b",
  orderNumber: "DL-000002",
  patientId: "pt-2",
  patientName: "Bob Smith",
  status: "Design",
  priority: "Urgent",
  updatedAt: "2024-12-11T10:00:00Z",
} as Order;

const ordersById: Record<string, Order> = {
  "ord-a": orderA,
  "ord-b": orderB,
};

describe("OrderWorkflowComponent", () => {
  let component: OrderWorkflowComponent;
  let fixture: ComponentFixture<OrderWorkflowComponent>;
  let paramMap$: BehaviorSubject<ParamMap>;

  beforeEach(async () => {
    paramMap$ = new BehaviorSubject(
      convertToParamMap({ orderId: "missing-order" }),
    );

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
            paramMap: paramMap$,
          },
        },
        {
          provide: OrderDataService,
          useValue: {
            loadOrders: jasmine.createSpy("loadOrders"),
            getOrderById: (id: string) => ordersById[id],
            updateOrder$: jasmine
              .createSpy("updateOrder$")
              .and.returnValue(of(orderA)),
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

  it("should re-derive orderId() and order() when the route param changes on the same instance", () => {
    expect(component.orderId()).toBe("missing-order");
    expect(component.order()).toBeUndefined();

    paramMap$.next(convertToParamMap({ orderId: "ord-a" }));
    fixture.detectChanges();
    expect(component.orderId()).toBe("ord-a");
    expect(component.order()?.id).toBe("ord-a");

    paramMap$.next(convertToParamMap({ orderId: "ord-b" }));
    fixture.detectChanges();
    expect(component.orderId()).toBe("ord-b");
    expect(component.order()?.id).toBe("ord-b");
  });
});
