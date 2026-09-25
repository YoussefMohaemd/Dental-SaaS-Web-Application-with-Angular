import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { HttpTestingController } from "@angular/common/http/testing";
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from "@angular/router";
import { of } from "rxjs";
import { ViewOrderComponent } from "./view-order.component";

describe("ViewOrderComponent", () => {
  let component: ViewOrderComponent;
  let fixture: ComponentFixture<ViewOrderComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewOrderComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ orderId: "ord-1" })),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewOrderComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectOne("/data/orders.json").flush([
      {
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
      },
    ]);
    fixture.detectChanges();
    const subOrdersRequest = httpMock.expectOne("/data/sub-orders.json");
    subOrdersRequest.flush([
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
        teeth: [11, 12, 13, 21, 22, 23],
        priority: "High",
        dueDate: "2024-12-25",
        notes:
          "Full mouth rehabilitation, occlusal vertical dimension to be confirmed.",
      },
    ]);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should expose seven stages and data-driven sub-orders", () => {
    expect(component.stages.length).toBe(7);
    expect(component.subOrders().length).toBeGreaterThan(0);
  });

  it("should format sub-order ids and progress", () => {
    expect(component.formatSubOrderId(0)).toBe("SO-01");
    const progress = component.subOrderProgress({
      id: "so-x",
      service: "Test",
      icon: "🦷",
      status: "done",
      formsComplete: 3,
      formsTotal: 3,
      scansComplete: 3,
      scansTotal: 3,
      teeth: [],
      priority: "Normal",
      dueDate: "2024-01-01",
      notes: "",
    } as never);
    expect(progress).toBeGreaterThanOrEqual(0);
    expect(progress).toBeLessThanOrEqual(100);
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
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewOrderComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ orderId: "missing-order" })),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewOrderComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectOne("/data/orders.json").flush([]);
    httpMock.expectOne("/data/patients.json").flush([]);
    httpMock.expectOne("/data/doctors.json").flush([]);
    httpMock.expectOne("/data/clinics.json").flush([]);
    httpMock.expectOne("/data/sub-orders.json").flush([]);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should expose an explicit not-found state for invalid ids", () => {
    expect(component.order()).toBeUndefined();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("Order not found");
  });
});

describe("ViewOrderComponent exact ord-33 flow", () => {
  let component: ViewOrderComponent;
  let fixture: ComponentFixture<ViewOrderComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewOrderComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ orderId: "ord-33" })),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewOrderComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectOne("/data/orders.json").flush([
      {
        id: "ord-33",
        orderNumber: "DL-024033",
        patientId: "pt33",
        patientName: "Hannah Lindqvist",
        doctorId: "dr33",
        doctorName: "Dr. Jennifer Walsh",
        clinicId: "cl33",
        clinicName: "North Shore Dental",
        scanCenterId: "sc33",
        scanCenterName: "SC-North",
        status: "Design",
        priority: "High",
        restoration: "Crown",
        arch: "Mandible",
        format: "STL",
        shade: "A3",
        units: 1,
        amount: 850,
        billed: false,
        billTo: "North Shore Dental",
        vouchers: 0,
        isLocked: false,
        hasNotes: false,
        notes: "Order 33 parent record",
        receivedAt: "2024-12-12T08:00:00Z",
        updatedAt: "2024-12-12T15:00:00Z",
        dueDate: "2024-12-27",
      },
    ]);
    httpMock.expectOne("/data/patients.json").flush([]);
    httpMock.expectOne("/data/doctors.json").flush([]);
    httpMock.expectOne("/data/clinics.json").flush([]);
    httpMock.expectOne("/data/sub-orders.json").flush([
      {
        id: "so-57",
        orderId: "ord-33",
        service: "Crown Design",
        icon: "sparkles",
        status: "done",
        formsComplete: 3,
        formsTotal: 3,
        scansComplete: 2,
        scansTotal: 2,
        teeth: [45, 46, 47],
        priority: "High",
        dueDate: "2024-12-24",
        notes: "Previous sub-order",
      },
      {
        id: "so-58",
        orderId: "ord-33",
        service: "Shade Match",
        icon: "clipboard",
        status: "in-progress",
        formsComplete: 1,
        formsTotal: 1,
        scansComplete: 1,
        scansTotal: 1,
        teeth: [45, 46, 47],
        priority: "High",
        dueDate: "2024-12-27",
        notes:
          "Shade A3 verified against clinic photos before glaze. (teeth 45, 46, 47.)",
      },
    ]);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should resolve Order 33 and include Sub Order 58 in the summary", async () => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    fixture.detectChanges();
    expect(component.order()?.id).toBe("ord-33");
    expect(component.subOrders().some((sub) => sub.id === "so-58")).toBeTrue();
    expect(component.totalServices()).toBe(2);
  });

  it("should keep the summary counters aligned with sub-order data", async () => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    fixture.detectChanges();
    const sub58 = component.subOrders().find((sub) => sub.id === "so-58");
    expect(sub58?.formsComplete).toBe(1);
    expect(sub58?.formsTotal).toBe(1);
    expect(sub58?.scansComplete).toBe(1);
    expect(sub58?.scansTotal).toBe(1);
  });
});
