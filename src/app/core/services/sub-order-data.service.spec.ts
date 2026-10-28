import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { ApiEndpoint } from "@core/enum/api.endpoint";
import { SubOrderDataService } from "./sub-order-data.service";

describe("SubOrderDataService", () => {
  let service: SubOrderDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SubOrderDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should preserve service, teeth, and file-reference boundaries when creating sub-orders", () => {
    const created = service.createForOrder("ord-42", [
      {
        serviceId: "gfmr",
        service: "GFMR",
        icon: "⚙️",
        priority: "High",
        dueDate: "2024-12-24",
        notes: "Preserve contract",
        teeth: [11, 12],
        scanRequirements: ["Upper scan"],
        creationData: {
          serviceId: "gfmr",
          serviceDetails: { shade: "A2" },
          serviceForm: { clinicalNotes: "Needs review" },
          selectedTeeth: [11, 12],
          scanRequirements: ["Upper scan"],
          fileReferences: ["upper-scan.stl"],
        },
      },
    ]);

    expect(created.length).toBe(1);
    expect(created[0].orderId).toBe("ord-42");
    expect(created[0].creationData?.selectedTeeth).toEqual([11, 12]);
    expect(created[0].creationData?.fileReferences).toEqual(["upper-scan.stl"]);
    expect(service.getByOrderId("ord-42").length).toBe(1);
    expect(service.getDetailById(created[0].id)?.forms.length).toBe(3);
  });

  it("should send service-specific form and scan totals to the API", () => {
    service
      .createForOrder$("ord-42", [
        {
          serviceId: "final-restoration",
          service: "Final Restoration",
          icon: "✨",
          priority: "Normal",
          dueDate: "2024-12-24",
          notes: "",
          teeth: [11],
          scanRequirements: ["Prep scan"],
          creationData: {
            serviceId: "final-restoration",
            serviceDetails: {},
            serviceForm: {},
            selectedTeeth: [11],
            scanRequirements: ["Prep scan"],
            fileReferences: [],
          },
        },
      ])
      .subscribe();

    const request = httpMock.expectOne(ApiEndpoint.orderSubOrders("ord-42"));
    expect(request.request.body[0].formsTotal).toBe(3);
    expect(request.request.body[0].scansTotal).toBe(1);
    request.flush({ data: [] });
  });

  it("should synthesize detail records from the summary counts for the exact sub-order id", async () => {
    service.load();
    httpMock
      .expectOne(
        (request) =>
          request.url === ApiEndpoint.ORDERS &&
          request.params.get("page") === "1" &&
          request.params.get("pageSize") === "100",
      )
      .flush({
      data: [{ id: "ord-33" }],
      meta: { pagination: { page: 1, totalPages: 1 } },
    });
    httpMock.expectOne(ApiEndpoint.orderSubOrders("ord-33")).flush({
      data: [
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
          notes: "Shade A3 verified against clinic photos before glaze.",
        },
      ],
    });
    await new Promise((resolve) => setTimeout(resolve, 250));

    const detail = service.getDetailByContext("ord-33", "so-58");

    expect(detail?.id).toBe("so-58");
    expect(detail?.forms.length).toBe(1);
    expect(detail?.scans.length).toBe(1);
    expect(detail?.forms[0].label).toBe("Shade Match Form");
    expect(detail?.scans[0].label).toBe("Shade Match Scan");
    expect(
      service.getDetailByContext("ord-33", "missing-sub-order"),
    ).toBeUndefined();
    expect(service.getDetailByContext("ord-99", "so-58")).toBeUndefined();
  });

  it("should cap parallel sub-order requests while loading", () => {
    service.load();
    httpMock
      .expectOne(
        (request) =>
          request.url === ApiEndpoint.ORDERS &&
          request.params.get("page") === "1" &&
          request.params.get("pageSize") === "100",
      )
      .flush({
        data: Array.from({ length: 10 }, (_, index) => ({
          id: `ord-${index + 1}`,
        })),
        meta: { pagination: { page: 1, totalPages: 1 } },
      });

    const firstWave = httpMock.match((request) =>
      request.url.includes("/sub-orders"),
    );
    expect(firstWave.length).toBe(8);
    firstWave.forEach((request) => request.flush({ data: [] }));

    const secondWave = httpMock.match((request) =>
      request.url.includes("/sub-orders"),
    );
    expect(secondWave.length).toBe(2);
    secondWave.forEach((request) => request.flush({ data: [] }));
  });

  it("should replace existing sub-orders for an order when editing", () => {
    service.replaceForOrder("ord-1", [
      {
        serviceId: "final-restoration",
        service: "Final Restoration",
        icon: "✨",
        priority: "High",
        dueDate: "2024-12-29",
        notes: "Edited from order page",
        teeth: [11, 21],
        scanRequirements: ["Prep scan"],
        creationData: {
          serviceId: "final-restoration",
          serviceDetails: {},
          serviceForm: {},
          selectedTeeth: [11, 21],
          scanRequirements: ["Prep scan"],
          fileReferences: [],
        },
      },
    ]);

    const rows = service.getByOrderId("ord-1");
    expect(rows.length).toBe(1);
    expect(rows[0].service).toBe("Final Restoration");
  });

  it("should persist sub-order activity through the backend update", () => {
    const [created] = service.createForOrder("ord-1", [
      {
        serviceId: "gfmr",
        service: "GFMR",
        icon: "clipboard",
        priority: "Normal",
        dueDate: "2024-12-24",
        notes: "",
        teeth: [],
        scanRequirements: [],
        creationData: {
          serviceId: "gfmr",
          serviceDetails: {},
          serviceForm: {},
          selectedTeeth: [],
          scanRequirements: [],
          fileReferences: [],
        },
      },
    ]);

    service.addActivityNote(created.id, "Test User", "Review requested.");

    const request = httpMock.expectOne(
      ApiEndpoint.subOrder("ord-1", created.id),
    );
    expect(request.request.method).toBe("PATCH");
    expect(request.request.body.activity[0]).toEqual({
      time: "just now",
      user: "Test User",
      text: "Review requested.",
    });
    request.flush({ data: { ...created } });
  });

  it("should not count selected-local scans as completed uploads", () => {
    const [created] = service.createForOrder("ord-7", [
      {
        serviceId: "gfmr",
        service: "GFMR",
        icon: "clipboard",
        priority: "Normal",
        dueDate: "2024-12-24",
        notes: "",
        teeth: [],
        scanRequirements: ["Upper scan"],
        creationData: {
          serviceId: "gfmr",
          serviceDetails: {},
          serviceForm: {},
          selectedTeeth: [],
          scanRequirements: ["Upper scan"],
          fileReferences: [],
        },
      },
    ]);

    service.saveScanFiles(created.id, `${created.id}-scan-1`, [
      {
        id: "local-1",
        name: "upper-scan.stl",
        sizeBytes: 2048,
        sizeLabel: "2 KB",
        type: "model/stl",
        lastModified: Date.now(),
        selectedAt: new Date().toISOString(),
      },
    ]);

    const request = httpMock.expectOne(ApiEndpoint.subOrder("ord-7", created.id));
    expect(request.request.body.scansComplete).toBe(0);
    request.flush({ data: { ...created, scansComplete: 0 } });
  });
});
