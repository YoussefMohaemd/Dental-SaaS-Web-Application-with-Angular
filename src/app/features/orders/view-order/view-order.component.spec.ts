import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, convertToParamMap, provideRouter } from "@angular/router";
import { signal } from "@angular/core";
import { of } from "rxjs";
import { ViewOrderComponent } from "./view-order.component";
import { OrderDataService } from "@core/services/order-data.service";
import { PatientDataService } from "@core/services/patient-data.service";
import { DoctorDataService } from "@core/services/doctor-data.service";
import { ClinicDataService } from "@core/services/clinic-data.service";
import { SubOrderDataService } from "@core/services/sub-order-data.service";
import { AuthorizationService } from "@core/services/authorization.service";
import { Order, SubOrder } from "@core/interfaces";

const order = {
  id: "ord-1",
  orderNumber: "DL-024001",
  patientId: "pt1",
  patientName: "Alice Johnson",
  doctorId: "dr1",
  doctorName: "Dr. Allison Park",
  clinicId: "cl1",
  clinicName: "Bright Smile Dental",
  scanCenterId: "sc1",
  scanCenterName: "SC-LA Central",
  status: "New",
  priority: "Normal",
  restoration: "Crown",
  arch: "Maxilla",
  format: "STL",
  shade: "A2",
  units: 1,
  amount: 450,
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

const subOrders: SubOrder[] = [
  {
    id: "so-2",
    orderId: "ord-1",
    service: "GFMR",
    icon: "settings",
    status: "in-progress",
    formsComplete: 2,
    formsTotal: 3,
    scansComplete: 1,
    scansTotal: 3,
    teeth: [11, 12, 13],
    priority: "High",
    dueDate: "2024-12-25",
    notes: "Case note",
  },
];

function configureComponent(orderId: string, currentOrder?: Order, currentSubOrders = subOrders) {
  return TestBed.configureTestingModule({
    imports: [ViewOrderComponent],
    providers: [
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: {
          paramMap: of(convertToParamMap({ orderId })),
        },
      },
      {
        provide: OrderDataService,
        useValue: {
          orders: signal(currentOrder ? [currentOrder] : []),
          loadOrders: jasmine.createSpy("loadOrders"),
          getOrderById: (id: string) => (id === currentOrder?.id ? currentOrder : undefined),
          updateOrder$: () => of(currentOrder),
          deleteOrder$: () => of(void 0),
        },
      },
      {
        provide: PatientDataService,
        useValue: {
          patients: signal([]),
          loadPatients: jasmine.createSpy("loadPatients"),
          getPatientById: () => undefined,
        },
      },
      {
        provide: DoctorDataService,
        useValue: {
          doctors: signal([]),
          loadDoctors: jasmine.createSpy("loadDoctors"),
          getDoctorById: () => undefined,
        },
      },
      {
        provide: ClinicDataService,
        useValue: {
          clinics: signal([]),
          loadClinics: jasmine.createSpy("loadClinics"),
          getClinicById: () => undefined,
        },
      },
      {
        provide: SubOrderDataService,
        useValue: {
          subOrders: signal(currentSubOrders),
          load: jasmine.createSpy("load"),
          getByOrderId: (id: string) =>
            currentSubOrders.filter((subOrder) => subOrder.orderId === id),
        },
      },
      {
        provide: AuthorizationService,
        useValue: { has: () => true },
      },
    ],
  }).compileComponents();
}

describe("ViewOrderComponent", () => {
  let component: ViewOrderComponent;
  let fixture: ComponentFixture<ViewOrderComponent>;

  beforeEach(async () => {
    await configureComponent("ord-1", order);
    fixture = TestBed.createComponent(ViewOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should expose seven stages and data-driven sub-orders", () => {
    expect(component.stages.length).toBe(7);
    expect(component.subOrders().length).toBe(1);
  });

  it("should format sub-order ids and progress", () => {
    expect(component.formatSubOrderId(0)).toBe("SO-01");
    expect(
      component.subOrderProgress({
        ...subOrders[0],
        formsComplete: 3,
        formsTotal: 3,
        scansComplete: 3,
        scansTotal: 3,
      }),
    ).toBe(100);
  });

  it("should toggle the more-actions menu", () => {
    expect(component.moreMenuOpen()).toBeFalse();
    component.openMoreMenu();
    expect(component.moreMenuOpen()).toBeTrue();
    component.closeMoreMenu();
    expect(component.moreMenuOpen()).toBeFalse();
  });

  it("should open and close the note dialog", () => {
    component.openNoteDialog();
    expect(component.noteDialogVisible()).toBeTrue();
    component.closeNoteDialog();
    expect(component.noteDialogVisible()).toBeFalse();
  });

  it("should not save empty notes", () => {
    component.noteText.set("   ");
    component.saveNote();
    expect(component.notes().length).toBe(0);
    expect(component.noteSaving()).toBeFalse();
  });

  it("should ask for delete confirmation", () => {
    component.askDelete();
    expect(component.confirmDeleteVisible()).toBeTrue();
    component.cancelDelete();
    expect(component.confirmDeleteVisible()).toBeFalse();
  });

  it("should preserve the order id on the view-order breadcrumb", () => {
    component["navigationService"].currentPage.set("subOrder");
    component["navigationService"].currentParams.set({
      orderId: "ord-1",
      subOrderId: "so-2",
    });

    const crumbs = component["navigationService"].breadcrumbs();
    const viewOrderCrumb = crumbs.find((crumb) => crumb.page === "viewOrder");
    expect(viewOrderCrumb?.params).toEqual({ orderId: "ord-1" });
  });
});

describe("ViewOrderComponent invalid route", () => {
  let component: ViewOrderComponent;
  let fixture: ComponentFixture<ViewOrderComponent>;

  beforeEach(async () => {
    await configureComponent("missing-order");
    fixture = TestBed.createComponent(ViewOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should expose an explicit not-found state for invalid ids", () => {
    expect(component.order()).toBeUndefined();
    expect(fixture.nativeElement.textContent).toContain("Order not found");
  });
});

describe("ViewOrderComponent exact order flow", () => {
  let component: ViewOrderComponent;
  let fixture: ComponentFixture<ViewOrderComponent>;
  const exactOrder = { ...order, id: "ord-33", patientName: "Hannah Lindqvist", doctorName: "Dr. Jennifer Walsh" };
  const exactSubOrders: SubOrder[] = [
    { ...subOrders[0], id: "so-57", orderId: "ord-33", status: "done" },
    { ...subOrders[0], id: "so-58", orderId: "ord-33", status: "in-progress" },
  ];

  beforeEach(async () => {
    await configureComponent("ord-33", exactOrder, exactSubOrders);
    fixture = TestBed.createComponent(ViewOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should resolve the order and include its sub-orders in the summary", () => {
    expect(component.order()?.id).toBe("ord-33");
    expect(component.subOrders().some((sub) => sub.id === "so-58")).toBeTrue();
    expect(component.totalServices()).toBe(2);
  });

  it("should keep the summary counters aligned with sub-order data", () => {
    const sub58 = component.subOrders().find((sub) => sub.id === "so-58");
    expect(sub58?.formsComplete).toBe(2);
    expect(sub58?.formsTotal).toBe(3);
    expect(sub58?.scansComplete).toBe(1);
    expect(sub58?.scansTotal).toBe(3);
  });

  it("should render order patient and doctor names from the order response", () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain("Hannah Lindqvist");
    expect(text).toContain("Dr. Jennifer Walsh");
  });
});
