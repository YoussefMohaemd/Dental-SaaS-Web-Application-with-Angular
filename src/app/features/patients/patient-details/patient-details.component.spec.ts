import { ComponentFixture, TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from "@angular/router";
import { PatientDetailsComponent } from "./patient-details.component";
import { PatientDataService } from "@core/services/patient-data.service";
import { OrderDataService } from "@core/services/order-data.service";
import { CaseDataService } from "@core/services/case-data.service";
import { DocumentDataService } from "@core/services/document-data.service";

describe("PatientDetailsComponent", () => {
  let component: PatientDetailsComponent;
  let fixture: ComponentFixture<PatientDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientDetailsComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ patientId: "missing-patient" }),
            },
          },
        },
        {
          provide: PatientDataService,
          useValue: { getPatientById: () => undefined },
        },
        {
          provide: OrderDataService,
          useValue: { getOrdersByPatient: () => [] },
        },
        {
          provide: CaseDataService,
          useValue: { getCasesByPatient: () => [] },
        },
        {
          provide: DocumentDataService,
          useValue: { documents: signal([]) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should render the not-found state for an invalid patient id", () => {
    expect(component.patient()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain("Patient not found");
  });
});
