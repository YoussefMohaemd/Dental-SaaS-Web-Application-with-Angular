import { ComponentFixture, TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { provideRouter } from "@angular/router";
import { PatientsComponent } from "./patients.component";
import { PatientDataService } from "@core/services/patient-data.service";
import { Patient } from "@core/models";

function makePatient(overrides: Partial<Patient>): Patient {
  return {
    id: "p-1",
    name: "Jane Doe",
    dob: "1990-05-01",
    gender: "F",
    phone: "555-0101",
    email: "jane@example.com",
    clinicId: "c-1",
    clinicName: "Bright Smile Dental",
    doctorId: "d-1",
    doctorName: "Dr. Smith",
    status: "Active",
    ordersCount: 3,
    lastVisit: "2025-01-15",
    ...overrides,
  };
}

describe("PatientsComponent", () => {
  let component: PatientsComponent;
  let fixture: ComponentFixture<PatientsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientsComponent],
      providers: [
        provideRouter([]),
        {
          provide: PatientDataService,
          useValue: {
            patients: signal([
              makePatient({ id: "p-1", name: "Alice Ahmed" }),
              makePatient({ id: "p-2", name: "Bob Brown" }),
            ]),
            loading: signal(false),
            addPatient: jasmine.createSpy("addPatient"),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render sortable headers as real buttons with aria-label", () => {
    const sortHeaders = fixture.nativeElement.querySelectorAll(
      "th.enterprise-th-sort",
    );
    expect(sortHeaders.length).toBe(5);

    sortHeaders.forEach((th: Element) => {
      expect(th.getAttribute("scope")).toBe("col");
      const button = th.querySelector("button");
      expect(button).toBeTruthy();
      expect(button?.getAttribute("type")).toBe("button");
      expect(button?.getAttribute("aria-label")).toContain("Sort by");
      const icon = th.querySelector("span[aria-hidden='true']");
      expect(icon).toBeTruthy();
    });
  });

  it("should expose aria-sort matching the active sort column", () => {
    const nameTh = fixture.nativeElement.querySelector(
      "th[aria-sort][scope='col']",
    );
    expect(nameTh.getAttribute("aria-sort")).toBe("ascending");

    const dobTh = fixture.nativeElement.querySelectorAll(
      "th.enterprise-th-sort",
    )[1];
    expect(dobTh.getAttribute("aria-sort")).toBe("none");
  });

  it("should toggle aria-sort when the header button is activated", () => {
    const nameButton: HTMLButtonElement = fixture.nativeElement
      .querySelectorAll("th.enterprise-th-sort")[0]
      .querySelector("button");
    expect(nameButton).toBeTruthy();

    nameButton.click();
    fixture.detectChanges();
    expect(component.sortDir()).toBe("desc");
    expect(
      fixture.nativeElement
        .querySelectorAll("th.enterprise-th-sort")[0]
        .getAttribute("aria-sort"),
    ).toBe("descending");
  });

  it("should sort by a different column when its header button is clicked", () => {
    const ordersButton: HTMLButtonElement = fixture.nativeElement
      .querySelectorAll("th.enterprise-th-sort")[3]
      .querySelector("button");
    ordersButton.click();
    fixture.detectChanges();

    expect(component.sortCol()).toBe("ordersCount");
    expect(
      fixture.nativeElement
        .querySelectorAll("th.enterprise-th-sort")[3]
        .getAttribute("aria-sort"),
    ).toBe("ascending");
  });
});
