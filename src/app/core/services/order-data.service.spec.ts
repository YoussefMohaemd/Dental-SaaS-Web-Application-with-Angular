import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { ApiEndpoint } from "@core/enum/api.endpoint";
import { OrderDataService } from "./order-data.service";

describe("OrderDataService", () => {
  let service: OrderDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OrderDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should set error state and stop loading when the data request fails", () => {
    service.loadOrders();
    const request = httpMock.expectOne((req) => req.url === ApiEndpoint.ORDERS);
    expect(service.loading()).toBeTrue();
    expect(request.request.params.get("page")).toBe("1");
    expect(request.request.params.get("pageSize")).toBe("20");

    request.flush(
      { message: "failure" },
      { status: 500, statusText: "Server Error" },
    );

    expect(service.error()).toBe("Failed to load orders");
    expect(service.loading()).toBeFalse();
    expect(service.orders()).toEqual([]);
  });

  it("should preserve the create-order payload boundary", () => {
    const create$ = service.createOrder$({
      patientId: "pt-1",
      patientName: "Alice Johnson",
      doctorId: "dr-1",
      doctorName: "Dr. Park",
      clinicId: "cl-1",
      clinicName: "Bright Smile Dental",
      scanCenterId: "scan-1",
      scanCenterName: "Main Scan Center",
      status: "New",
      priority: "High",
      restoration: "Crown",
      arch: "Maxilla",
      format: "STL",
      shade: "A2",
      units: 2,
      amount: 500,
      billed: false,
      billTo: "Bright Smile Dental",
      vouchers: 0,
      isLocked: false,
      hasNotes: true,
      notes: "Create-order contract test",
      dueDate: "2024-12-24",
      creationData: {
        services: [
          {
            serviceId: "gfmr",
            serviceDetails: { shade: "A2", arch: "Both" },
            serviceForm: { clinicalNotes: "Needs review" },
            selectedTeeth: [11, 12],
            scanRequirements: ["Upper arch scan"],
            fileReferences: ["scan-1.stl"],
          },
        ],
      },
    });
    create$.subscribe();

    const request = httpMock.expectOne(ApiEndpoint.ORDERS);
    expect(request.request.method).toBe("POST");
    expect(request.request.body.patientId).toBe("pt-1");
    expect(
      request.request.body.creationData.services[0].fileReferences,
    ).toEqual(["scan-1.stl"]);
    request.flush({
      data: {
        id: "ord-1",
        orderNumber: "DL-024001",
        patientId: "pt-1",
        doctorId: "dr-1",
        clinicId: "cl-1",
        scanCenterId: "scan-1",
        status: "New",
        priority: "High",
        restoration: "Crown",
        arch: "Maxilla",
        format: "STL",
        shade: "A2",
        units: 2,
        amount: 500,
        billed: false,
        billTo: "Bright Smile Dental",
        vouchers: 0,
        isLocked: false,
        hasNotes: true,
        notes: "Create-order contract test",
        dueDate: "2024-12-24",
      },
    });

    expect(service.orders().length).toBe(1);
  });

  it("should omit status when updating fields without a status change", () => {
    service
      .updateOrder$("ord-1", {
        patientId: "pt-1",
        notes: "Updated notes",
      })
      .subscribe();

    const request = httpMock.expectOne(`${ApiEndpoint.ORDERS}/ord-1`);
    expect(request.request.method).toBe("PATCH");
    expect(request.request.body).toEqual({
      patientId: "pt-1",
      notes: "Updated notes",
    });
    request.flush({
      data: {
        id: "ord-1",
        patientId: "pt-1",
        status: "Review",
        notes: "Updated notes",
      },
    });
  });

  it("should recover from error after reload", () => {
    service.loadOrders();
    httpMock
      .expectOne((req) => req.url === ApiEndpoint.ORDERS)
      .flush({}, { status: 500, statusText: "Server Error" });

    expect(service.error()).toBe("Failed to load orders");

    service.reload();
    const request = httpMock.expectOne((req) => req.url === ApiEndpoint.ORDERS);
    expect(request.request.params.get("page")).toBe("1");
    expect(request.request.params.get("pageSize")).toBe("20");
    request.flush({
      data: [
        {
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
          billTo: "Bright Smile Dental",
          vouchers: 0,
          isLocked: false,
          hasNotes: false,
          notes: "",
          receivedAt: "2026-09-26T10:00:00.000Z",
          updatedAt: "2026-09-26T10:00:00.000Z",
          dueDate: "2026-10-01",
        },
      ],
    });

    expect(service.error()).toBeNull();
    expect(service.loading()).toBeFalse();
    expect(service.orders().length).toBe(1);
  });

  it("should cache an order fetched by id", () => {
    let fetchedId: string | undefined;

    service.getOrderById$("ord-99").subscribe((order) => {
      fetchedId = order.id;
    });

    const request = httpMock.expectOne(`${ApiEndpoint.ORDERS}/ord-99`);
    expect(request.request.method).toBe("GET");
    request.flush({
      data: {
        id: "ord-99",
        orderNumber: "DL-099999",
        patientId: "pt-1",
        patientName: "Alice Johnson",
        doctorId: "dr-1",
        doctorName: "Dr. Park",
        clinicId: "cl-1",
        clinicName: "Bright Smile Dental",
        scanCenterId: "scan-1",
        scanCenterName: "Main Scan Center",
        status: "Review",
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
        receivedAt: "2026-09-26T10:00:00.000Z",
        updatedAt: "2026-09-26T10:00:00.000Z",
        dueDate: "2026-10-01",
      },
    });

    expect(fetchedId).toBe("ord-99");
    expect(service.getOrderById("ord-99")?.id).toBe("ord-99");
  });

  it("should load all order pages for aggregate views", () => {
    service.loadAllOrders();

    const firstPageRequest = httpMock.expectOne(
      (req) =>
        req.url === ApiEndpoint.ORDERS &&
        req.params.get("page") === "1" &&
        req.params.get("pageSize") === "100",
    );
    firstPageRequest.flush({
      data: [
        {
          id: "ord-1",
          orderNumber: "DL-000001",
          patientId: "pt-1",
          doctorId: "dr-1",
          clinicId: "cl-1",
          status: "New",
        },
      ],
      meta: { pagination: { page: 1, pageSize: 100, totalItems: 3, totalPages: 2 } },
    });

    const secondPageRequest = httpMock.expectOne(
      (req) =>
        req.url === ApiEndpoint.ORDERS &&
        req.params.get("page") === "2" &&
        req.params.get("pageSize") === "100",
    );
    secondPageRequest.flush({
      data: [
        {
          id: "ord-2",
          orderNumber: "DL-000002",
          patientId: "pt-2",
          doctorId: "dr-2",
          clinicId: "cl-1",
          status: "Review",
        },
        {
          id: "ord-3",
          orderNumber: "DL-000003",
          patientId: "pt-3",
          doctorId: "dr-1",
          clinicId: "cl-2",
          status: "Design",
        },
      ],
      meta: { pagination: { page: 2, pageSize: 100, totalItems: 3, totalPages: 2 } },
    });

    expect(service.orders().length).toBe(3);
    expect(service.pagination().totalItems).toBe(3);
    expect(service.loading()).toBeFalse();
    expect(service.error()).toBeNull();
  });
});
