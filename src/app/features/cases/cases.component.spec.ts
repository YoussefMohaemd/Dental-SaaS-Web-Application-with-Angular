import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { signal } from "@angular/core";
import { provideRouter } from "@angular/router";
import { CasesComponent } from "./cases.component";
import { CaseDataService } from "@core/services/case-data.service";
import { DocumentDataService } from "@core/services/document-data.service";
import { NavigationService } from "@core/services/navigation.service";
import { OrderDataService } from "@core/services/order-data.service";
import { FormatUtils } from "@core/services/format-utils.service";
import { Case, LabDocument, Order } from "@core/models";

const MOCK_CASES: Case[] = [
  {
    id: "case-1",
    caseNumber: "CS-08101",
    title: "Full Arch Restoration — Alice Johnson",
    patientId: "pt1",
    patientName: "Alice Johnson",
    doctorId: "dr1",
    doctorName: "Dr. Allison Park",
    clinicId: "cl1",
    clinicName: "Bright Smile Dental",
    status: "Open",
    priority: "High",
    ordersCount: 3,
    filesCount: 8,
    createdAt: "2024-11-10T10:00:00Z",
    updatedAt: "2024-12-10T14:00:00Z",
    notes: "",
  },
  {
    id: "case-2",
    caseNumber: "CS-08102",
    title: "Smile Makeover — Benjamin Clarke",
    patientId: "pt2",
    patientName: "Benjamin Clarke",
    doctorId: "dr2",
    doctorName: "Dr. Marcus Webb",
    clinicId: "cl1",
    clinicName: "Bright Smile Dental",
    status: "In Progress",
    priority: "Normal",
    ordersCount: 2,
    filesCount: 5,
    createdAt: "2024-11-15T11:00:00Z",
    updatedAt: "2024-12-08T09:00:00Z",
    notes: "",
  },
  {
    id: "case-3",
    caseNumber: "CS-08103",
    title: "Implant Case — Carmen Rodriguez",
    patientId: "pt3",
    patientName: "Carmen Rodriguez",
    doctorId: "dr3",
    doctorName: "Dr. Sophia Lin",
    clinicId: "cl2",
    clinicName: "Pacific Dental Group",
    status: "Closed",
    priority: "Low",
    ordersCount: 1,
    filesCount: 2,
    createdAt: "2024-10-20T14:00:00Z",
    updatedAt: "2024-12-12T15:00:00Z",
    notes: "",
  },
];

const MOCK_ORDERS: Order[] = [
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
  {
    id: "ord-2",
    orderNumber: "DL-024002",
    patientId: "pt2",
    patientName: "Benjamin Clarke",
    doctorId: "dr2",
    doctorName: "Dr. Marcus Webb",
    clinicId: "cl1",
    clinicName: "Bright Smile Dental",
    scanCenterId: "sc1",
    scanCenterName: "SC-LA Central",
    status: "Review",
    priority: "High",
    restoration: "Bridge",
    arch: "Mandible",
    format: "STL",
    shade: "B1",
    units: 3,
    amount: 1200,
    billed: true,
    billedAmount: 1200,
    billTo: "Benjamin Clarke",
    vouchers: 1,
    isLocked: false,
    hasNotes: true,
    notes: "Shade verified",
    receivedAt: "2024-12-08T14:30:00Z",
    sentAt: "2024-12-09T09:00:00Z",
    updatedAt: "2024-12-09T09:00:00Z",
    chargedAt: "2024-12-09T09:00:00Z",
    dueDate: "2024-12-22",
    changeRequest: "Pending Review",
    csTask: "Follow Up",
    technicianName: "M. Rivera",
  },
];

const MOCK_DOCUMENTS: LabDocument[] = [
  {
    id: "d1",
    name: "alice_scan.stl",
    category: "Scan Files",
    type: "STL",
    size: "4 MB",
    date: "2024-12-10",
    doctor: "Dr. Allison Park",
    patientName: "Alice Johnson",
  },
  {
    id: "d2",
    name: "benjamin_scan.stl",
    category: "Scan Files",
    type: "STL",
    size: "3 MB",
    date: "2024-12-09",
    doctor: "Dr. Marcus Webb",
    patientName: "Benjamin Clarke",
  },
];

describe("CasesComponent", () => {
  let component: CasesComponent;
  let fixture: ComponentFixture<CasesComponent>;
  let navigationService: jasmine.SpyObj<NavigationService>;

  beforeEach(async () => {
    const caseSpy = jasmine.createSpyObj("CaseDataService", [], {
      cases: signal(MOCK_CASES),
      loading: signal(false),
    });
    const orderSpy = jasmine.createSpyObj("OrderDataService", [], {
      orders: signal(MOCK_ORDERS),
    });
    const documentSpy = jasmine.createSpyObj("DocumentDataService", [], {
      documents: signal(MOCK_DOCUMENTS),
    });
    const navSpy = jasmine.createSpyObj("NavigationService", ["navigate"]);
    const formatSpy = jasmine.createSpyObj("FormatUtils", ["timeAgo"]);
    formatSpy.timeAgo.and.returnValue("1d ago");

    await TestBed.configureTestingModule({
      imports: [CasesComponent],
      providers: [
        provideRouter([]),
        { provide: CaseDataService, useValue: caseSpy },
        { provide: OrderDataService, useValue: orderSpy },
        { provide: DocumentDataService, useValue: documentSpy },
        { provide: NavigationService, useValue: navSpy },
        { provide: FormatUtils, useValue: formatSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CasesComponent);
    component = fixture.componentInstance;
    navigationService = TestBed.inject(
      NavigationService,
    ) as jasmine.SpyObj<NavigationService>;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should show the total case count", () => {
    expect(
      fixture.debugElement.query(By.css("h1")).nativeElement.textContent,
    ).toContain("Cases");
    expect(component.filtered().length).toBe(3);
  });

  it("should navigate to createOrder when New Case is clicked (React parity)", () => {
    component.navigateToCreateOrder();
    expect(navigationService.navigate).toHaveBeenCalledWith("createOrder");
    const action = fixture.debugElement.query(By.css("app-button"));
    expect(action.nativeElement.textContent).toContain("New Case");
  });

  it("should filter cases by search text", () => {
    component.search.set("alice");
    expect(component.filtered().length).toBe(1);
    expect(component.filtered()[0].caseNumber).toBe("CS-08101");
    component.search.set("");
    expect(component.filtered().length).toBe(3);
  });

  it("should filter cases by status", () => {
    component.statusFilter.set("Closed");
    expect(component.filtered().length).toBe(1);
    component.statusFilter.set("");
    expect(component.filtered().length).toBe(3);
  });

  it("should switch between table and grid views", () => {
    expect(component.view()).toBe("table");
    component.setView("grid");
    expect(component.view()).toBe("grid");
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css(".grid"))).toBeTruthy();
  });

  it("should navigate to case details on row click", () => {
    component.navigateToCase("case-1");
    expect(navigationService.navigate).toHaveBeenCalledWith("caseDetails", {
      caseId: "case-1",
    });
  });

  it("should paginate with a page size of 12", () => {
    expect(component.pageSize).toBe(12);
    expect(component.totalPages()).toBe(1);
    component.onPageNumberChange(1);
    expect(component.page()).toBe(1);
    expect(component.pageData().length).toBe(3);
  });

  it("should derive orders and files counts from linked datasets", () => {
    expect(component.getOrdersCount(MOCK_CASES[0])).toBe(1);
    expect(component.getFilesCount(MOCK_CASES[0])).toBe(1);
    expect(component.getOrdersCount(MOCK_CASES[2])).toBe(0);
    expect(component.getFilesCount(MOCK_CASES[2])).toBe(0);
  });
});
