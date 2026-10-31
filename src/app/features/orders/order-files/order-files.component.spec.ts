import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import {
  ActivatedRoute,
  convertToParamMap,
  ParamMap,
  provideRouter,
} from "@angular/router";
import { BehaviorSubject } from "rxjs";
import { OrderFilesComponent } from "./order-files.component";
import { OrderDataService } from "@core/services/order-data.service";
import { Order } from "@core/interfaces";

const orderA = {
  id: "ord-a",
  orderNumber: "DL-000001",
  patientId: "pt-1",
  patientName: "Alice Johnson",
  status: "New",
  priority: "Normal",
} as Order;

const orderB = {
  id: "ord-b",
  orderNumber: "DL-000002",
  patientId: "pt-2",
  patientName: "Bob Smith",
  status: "Design",
  priority: "Urgent",
} as Order;

const ordersById: Record<string, Order> = {
  "ord-a": orderA,
  "ord-b": orderB,
};

describe("OrderFilesComponent", () => {
  let component: OrderFilesComponent;
  let fixture: ComponentFixture<OrderFilesComponent>;
  let paramMap$: BehaviorSubject<ParamMap>;

  beforeEach(async () => {
    paramMap$ = new BehaviorSubject(
      convertToParamMap({ orderId: "missing-order" }),
    );

    await TestBed.configureTestingModule({
      imports: [OrderFilesComponent],
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
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderFilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create with six seeded files", () => {
    expect(component).toBeTruthy();
    expect(component.files().length).toBe(6);
  });

  it("should partition uploaded files", () => {
    expect(component.uploadedFiles().length).toBe(6);
    expect(component.uploadingFiles().length).toBe(0);
  });

  it("should delete a file", () => {
    component.deleteFile("f1");
    expect(component.files().find((f) => f.id === "f1")).toBeUndefined();
  });

  it("should open and close the PrimeNG preview dialog", () => {
    component.openPreview(component.files()[0]);
    expect(component.previewVisible()).toBeTrue();
    component.closePreview();
    expect(component.previewVisible()).toBeFalse();
  });

  it("should expose an explicit not-found state for invalid ids", () => {
    expect(component.order()).toBeUndefined();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("Order not found");
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
