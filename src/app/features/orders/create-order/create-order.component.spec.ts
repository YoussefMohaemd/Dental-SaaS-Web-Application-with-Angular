import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideRouter } from "@angular/router";
import { CreateOrderComponent } from "./create-order.component";

describe("CreateOrderComponent", () => {
  let component: CreateOrderComponent;
  let fixture: ComponentFixture<CreateOrderComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateOrderComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateOrderComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectOne("/data/patients.json").flush([
      {
        id: "p1",
        name: "Alice Johnson",
        gender: "F",
        dob: "1988-04-12",
        status: "Active",
        ordersCount: 0,
        lastVisit: "2024-12-01",
        email: "alice@example.com",
        phone: "555-0101",
        clinicId: "c1",
        clinicName: "Bright Smile Dental",
        doctorId: "d1",
        doctorName: "Dr. Park",
      },
    ]);
    httpMock.expectOne("/data/doctors.json").flush([
      {
        id: "d1",
        lookupId: "2077",
        name: "Dr. Park",
        specialty: "Prosthodontics",
        clinicId: "c1",
        clinicName: "Bright Smile Dental",
        status: "Active",
        email: "dr.park@example.com",
        phone: "555-0202",
        ordersCount: 0,
        joinedDate: "2020-01-01",
      },
    ]);
    httpMock.expectOne("/data/clinics.json").flush([
      {
        id: "c1",
        name: "Bright Smile Dental",
        status: "Active",
        city: "Seattle",
      },
    ]);
    httpMock.expectOne("/data/scan-centers.json").flush([
      {
        id: "sc1",
        name: "Main Scan Center",
        status: "Operational",
      },
    ]);
    httpMock.expectOne("/data/orders.json").flush([]);
    httpMock.expectOne("/data/sub-orders.json").flush([]);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should create and start at step 1", () => {
    expect(component).toBeTruthy();
    expect(component.step()).toBe(1);
  });

  it("should block proceeding without required patient and doctor", () => {
    expect(component.canProceed()).toBeFalse();
  });

  it("should toggle services", () => {
    component.toggleService("gfmr");
    expect(component.selectedServices()).toContain("gfmr");
    component.toggleService("gfmr");
    expect(component.selectedServices()).not.toContain("gfmr");
  });

  it("should open upload picker for a service requirement", () => {
    const input = document.createElement("input");
    spyOn(input, "click");

    component.openUploadDialogForRequirement("gfmr", "Upper arch scan", input);

    expect(input.click).toHaveBeenCalled();
  });

  it("should toggle teeth in general context", () => {
    component.toggleTooth(11);
    expect(component.selectedTeeth()).toContain(11);
  });

  it("should advance when step 1 is complete", () => {
    component.setField("patientName", "Alice Johnson");
    component.setField("doctorName", "Dr. Park");
    expect(component.canProceed()).toBeTrue();
    component.nextStep();
    expect(component.step()).toBe(2);
  });

  it("should allow matching doctor input by ID", () => {
    component.setField("patientName", "Alice Johnson");
    component.onDoctorInput("2077");
    expect(component.canProceed()).toBeTrue();
  });

  it("should not advance when step 1 is incomplete", () => {
    component.nextStep();
    expect(component.step()).toBe(1);
  });

  it("should block step 2 without a selected service", () => {
    component.setField("patientName", "Alice Johnson");
    component.setField("doctorName", "Dr. Park");
    component.nextStep();
    expect(component.step()).toBe(2);
    expect(component.canProceed()).toBeFalse();
    component.nextStep();
    expect(component.step()).toBe(2);
  });

  it("should block step 3 for services that require teeth", () => {
    component.setField("patientName", "Alice Johnson");
    component.setField("doctorName", "Dr. Park");
    component.nextStep();
    component.toggleService("surgical-guide");
    component.nextStep();
    expect(component.step()).toBe(3);
    expect(component.canProceed()).toBeFalse();
    component.toggleTooth(11);
    expect(component.canProceed()).toBeTrue();
  });

  it("should not jump over invalid steps via the stepper", () => {
    component.goToStep(3);
    expect(component.step()).toBe(1);
    component.setField("patientName", "Alice Johnson");
    component.setField("doctorName", "Dr. Park");
    component.goToStep(2);
    expect(component.step()).toBe(2);
    component.goToStep(4);
    expect(component.step()).toBe(2);
  });

  it("should allow navigating back to completed steps", () => {
    component.setField("patientName", "Alice Johnson");
    component.setField("doctorName", "Dr. Park");
    component.nextStep();
    component.toggleService("gfmr");
    component.nextStep();
    expect(component.step()).toBe(3);
    component.goToStep(1);
    expect(component.step()).toBe(1);
  });

  it("should seed per-service details and clinical forms on selection", () => {
    component.toggleService("surgical-guide");
    expect(component.getServiceDetail("surgical-guide").implantSystem).toBe(
      "Straumann",
    );
    expect(component.getServiceForm("surgical-guide").marginType).toBe(
      "Feather edge",
    );
    component.setServiceDetail("surgical-guide", "shade", "B1");
    expect(component.getServiceDetail("surgical-guide").shade).toBe("B1");
  });

  it("should track per-service tooth assignment", () => {
    component.toggleService("gfmr");
    component.activeServiceForTeeth.set("gfmr");
    component.toggleTooth(11);
    expect(component.teethForService("gfmr")).toContain(11);
    expect(component.allSelectedTeeth()).toContain(11);
  });

  it("should expose the visible chart selection as a reactive computed", () => {
    component.toggleTooth(12);
    expect(component.visibleSelectedTeeth()).toContain(12);
    component.toggleService("gfmr");
    component.activeServiceForTeeth.set("gfmr");
    expect(component.visibleSelectedTeeth()).not.toContain(12);
    component.toggleTooth(11);
    expect(component.visibleSelectedTeeth()).toContain(11);
  });

  it("should combine general and per-service teeth for review", () => {
    component.toggleTooth(12);
    component.toggleService("gfmr");
    component.activeServiceForTeeth.set("gfmr");
    component.toggleTooth(11);
    expect(component.allTeethCombined()).toEqual([11, 12]);
  });

  it("should include selected file references for each service on submit", () => {
    component.setField("patientName", "Alice Johnson");
    component.setField("doctorName", "Dr. Park");
    component.setField("clinicId", "c1");
    component.toggleService("gfmr");
    component.toggleTooth(11);

    const input = document.createElement("input");
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(new File(["scan"], "upper-arch.stl"));
    dataTransfer.items.add(new File(["scan"], "bite-scan.obj"));
    Object.defineProperty(input, "files", {
      configurable: true,
      value: dataTransfer.files,
    });

    component.openUploadDialogForRequirement("gfmr", "Upper arch scan", input);
    component.onUploadFilesSelected({ target: input } as unknown as Event);

    const orderService = (component as any).orderService as {
      createOrder: jasmine.Spy;
    };
    const subOrderService = (component as any).subOrderService as {
      createForOrder: jasmine.Spy;
    };
    spyOn(orderService, "createOrder").and.callThrough();
    spyOn(subOrderService, "createForOrder").and.returnValue([]);
    spyOn((component as any).navigationService, "navigate");

    component.submitOrder();

    expect(orderService.createOrder).toHaveBeenCalled();
    const createdOrderArg = orderService.createOrder.calls.mostRecent().args[0];
    expect(createdOrderArg.creationData.services[0].fileReferences).toEqual([
      "upper-arch.stl",
      "bite-scan.obj",
    ]);
  });

  it("should persist communication metadata and auto pricing on submit", () => {
    component.setField("patientName", "Alice Johnson");
    component.setField("doctorName", "Dr. Park");
    component.toggleService("gfmr");
    component.toggleTooth(11);
    component.setField("notes", "Call clinic after design approval.");
    component.toggleMailRecipient("CS", true);
    component.setIhTaskRecipient("Sales");
    component.toggleRushTask(true);

    const input = document.createElement("input");
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(new File(["note"], "internal-note.pdf"));
    Object.defineProperty(input, "files", {
      configurable: true,
      value: dataTransfer.files,
    });
    component.onInternalCaseFilesSelected({ target: input } as unknown as Event);

    const orderService = (component as any).orderService as {
      createOrder: jasmine.Spy;
    };
    const subOrderService = (component as any).subOrderService as {
      createForOrder: jasmine.Spy;
    };
    spyOn(orderService, "createOrder").and.callThrough();
    spyOn(subOrderService, "createForOrder").and.returnValue([]);
    spyOn((component as any).navigationService, "navigate");

    component.submitOrder();

    expect(orderService.createOrder).toHaveBeenCalled();
    const createdOrderArg = orderService.createOrder.calls.mostRecent().args[0];
    expect(createdOrderArg.amount).toBe(580);
    expect(createdOrderArg.billTo).toBe("Doctor • Dr. Park");
    expect(createdOrderArg.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(createdOrderArg.creationData.communication.sendMailTo).toEqual(["CS"]);
    expect(createdOrderArg.creationData.communication.sendIhTaskTo).toBe("Sales");
    expect(createdOrderArg.creationData.communication.rushTask).toBeTrue();
    expect(createdOrderArg.creationData.communication.internalCaseFiles).toEqual([
      "internal-note.pdf",
    ]);
  });

  it("should set bill-to as scan center when selected", () => {
    component.setField("patientName", "Alice Johnson");
    component.setField("doctorName", "Dr. Park");
    component.setField("billToTarget", "scan-center");
    component.toggleService("gfmr");
    component.toggleTooth(11);

    const orderService = (component as any).orderService as {
      createOrder: jasmine.Spy;
    };
    const subOrderService = (component as any).subOrderService as {
      createForOrder: jasmine.Spy;
    };
    spyOn(orderService, "createOrder").and.callThrough();
    spyOn(subOrderService, "createForOrder").and.returnValue([]);
    spyOn((component as any).navigationService, "navigate");

    component.submitOrder();

    const createdOrderArg = orderService.createOrder.calls.mostRecent().args[0];
    expect(createdOrderArg.billTo).toBe("Scan Center • Main Scan Center");
  });

  it("should preserve service/form/tooth/file references on submit", () => {
    component.setField("patientName", "Alice Johnson");
    component.setField("doctorName", "Dr. Park");
    component.setField("clinicId", "c1");
    component.toggleService("gfmr");
    component.setServiceDetail(
      "gfmr",
      "serviceNotes",
      "Submit-order contract test",
    );
    component.setServiceForm("gfmr", "clinicalNotes", "Clinical notes");
    component.activeServiceForTeeth.set("gfmr");
    component.toggleTooth(11);

    const orderService = (component as any).orderService as {
      createOrder: jasmine.Spy;
    };
    const subOrderService = (component as any).subOrderService as {
      createForOrder: jasmine.Spy;
    };
    spyOn(orderService, "createOrder").and.callThrough();
    spyOn(subOrderService, "createForOrder").and.returnValue([]);
    spyOn((component as any).navigationService, "navigate");

    component.submitOrder();

    expect(orderService.createOrder).toHaveBeenCalled();
    const createdOrderArg = orderService.createOrder.calls.mostRecent().args[0];
    expect(createdOrderArg.creationData.services[0].serviceId).toBe("gfmr");
    expect(
      createdOrderArg.creationData.services[0].serviceDetails.serviceNotes,
    ).toBe("Submit-order contract test");
    expect(
      createdOrderArg.creationData.services[0].serviceForm.clinicalNotes,
    ).toBe("Clinical notes");
    expect(createdOrderArg.creationData.services[0].selectedTeeth).toEqual([
      11,
    ]);
    expect(createdOrderArg.creationData.services[0].fileReferences).toEqual([]);
    expect(subOrderService.createForOrder).toHaveBeenCalled();
    const createdRows =
      subOrderService.createForOrder.calls.mostRecent().args[1];
    expect(createdRows[0].creationData.serviceId).toBe("gfmr");
    expect(createdRows[0].creationData.selectedTeeth).toEqual([11]);
    expect((component as any).navigationService.navigate).toHaveBeenCalledWith(
      "viewOrder",
      jasmine.any(Object),
    );
  });
});
