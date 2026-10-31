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
import { EditOrderComponent } from "./edit-order.component";
import { OrderDataService } from "@core/services/order-data.service";
import { Order } from "@core/interfaces";

const orderA = {
  id: "ord-a",
  orderNumber: "DL-000001",
  patientId: "pt-1",
  patientName: "Alice Johnson",
  doctorId: "dr-1",
  doctorName: "Dr. Park",
  clinicId: "cl-1",
  clinicName: "Bright Smile Dental",
  scanCenterId: "sc-1",
  scanCenterName: "SC Central",
  status: "New",
  priority: "Normal",
  restoration: "Crown",
  arch: "Maxilla",
  format: "STL",
  shade: "A2",
  units: 1,
  amount: 250,
  billed: false,
  billTo: "Bright Smile Dental",
  vouchers: 0,
  isLocked: false,
  hasNotes: false,
  notes: "",
  receivedAt: "2024-12-10T10:00:00Z",
  updatedAt: "2024-12-10T10:00:00Z",
  dueDate: "2024-12-24",
} as Order;

const orderB = {
  ...orderA,
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

describe("EditOrderComponent", () => {
  let component: EditOrderComponent;
  let fixture: ComponentFixture<EditOrderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditOrderComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should build the edit form with validation", () => {
    expect(component.editForm).toBeTruthy();
    component.editForm.controls.units.setValue(0);
    expect(component.editForm.controls.units.invalid).toBeTrue();
    component.editForm.controls.units.setValue(2);
    expect(component.editForm.controls.units.valid).toBeTrue();
  });

  it("should toggle the order lock", () => {
    const initial = component.isLocked();
    component.toggleLock();
    expect(component.isLocked()).toBe(!initial);
  });

  it("should flag invalid required fields", () => {
    component.editForm.controls.patientName.setValue("");
    component.editForm.controls.patientName.markAsTouched();
    expect(component.fieldInvalid("patientName")).toBeTrue();
  });

  it("should keep doctor and clinic optional", () => {
    component.editForm.controls.patientName.setValue("Alice Johnson");
    component.editForm.controls.doctorName.setValue("");
    component.editForm.controls.clinicId.setValue("");
    expect(component.editForm.valid).toBeTrue();
  });

  it("should require teeth for services that need them", () => {
    component.editForm.controls.patientName.setValue("Alice Johnson");
    component.toggleService("surgical-guide");
    expect(component.canSave()).toBeFalse();
    component.setServiceTeethInput("surgical-guide", "11, 12");
    expect(component.canSave()).toBeTrue();
  });

  it("should allow removing and adding teeth interactively in edit mode", () => {
    component.toggleService("gfmr");
    component.setServiceTeethInput("gfmr", "11, 12");
    component.toggleServiceTooth("gfmr", 12);
    component.toggleServiceTooth("gfmr", 21);
    expect(component.teethInputValue("gfmr")).toBe("11, 21");
    component.clearServiceTeeth("gfmr");
    expect(component.teethInputValue("gfmr")).toBe("");
  });
});

describe("EditOrderComponent route param reactivity", () => {
  let component: EditOrderComponent;
  let fixture: ComponentFixture<EditOrderComponent>;
  let paramMap$: BehaviorSubject<ParamMap>;

  beforeEach(async () => {
    paramMap$ = new BehaviorSubject(convertToParamMap({ orderId: "ord-a" }));

    await TestBed.configureTestingModule({
      imports: [EditOrderComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ orderId: "ord-a" }),
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

    fixture = TestBed.createComponent(EditOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should re-derive orderId() and order() when the route param changes on the same instance", () => {
    expect(component.orderId()).toBe("ord-a");
    expect(component.order()?.id).toBe("ord-a");
    expect(component.editForm.controls.patientName.value).toBe("Alice Johnson");

    paramMap$.next(convertToParamMap({ orderId: "ord-b" }));
    fixture.detectChanges();

    expect(component.orderId()).toBe("ord-b");
    expect(component.order()?.id).toBe("ord-b");
    expect(component.editForm.controls.patientName.value).toBe("Bob Smith");
  });
});
