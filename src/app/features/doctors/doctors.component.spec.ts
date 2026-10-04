import { ComponentFixture, TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { provideRouter } from "@angular/router";
import { DoctorsComponent } from "./doctors.component";
import { DoctorDataService } from "@core/services/doctor-data.service";
import { OrderDataService } from "@core/services/order-data.service";
import { Doctor } from "@core/models";

function makeDoctor(overrides: Partial<Doctor>): Doctor {
  return {
    id: "d-1",
    name: "Dr. Smith",
    specialty: "Orthodontics",
    clinicId: "c-1",
    clinicName: "Bright Smile Dental",
    email: "smith@example.com",
    phone: "555-0102",
    status: "Active",
    ordersCount: 5,
    joinedDate: "2023-06-01",
    avatar: "",
    ...overrides,
  };
}

describe("DoctorsComponent", () => {
  let component: DoctorsComponent;
  let fixture: ComponentFixture<DoctorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorsComponent],
      providers: [
        provideRouter([]),
        {
          provide: DoctorDataService,
          useValue: {
            doctors: signal([
              makeDoctor({ id: "d-1", name: "Dr. Adams" }),
              makeDoctor({ id: "d-2", name: "Dr. Baker" }),
            ]),
            loading: signal(false),
            addDoctor: jasmine.createSpy("addDoctor"),
          },
        },
        {
          provide: OrderDataService,
          useValue: {
            orders: signal([
              { id: "o-1", doctorId: "d-1", patientId: "p-1" },
              { id: "o-2", doctorId: "d-1", patientId: "p-2" },
              { id: "o-3", doctorId: "d-2", patientId: "p-3" },
            ]),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DoctorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render every sort config as a keyboard-operable header button", () => {
    const sortHeaders = fixture.nativeElement.querySelectorAll(
      "th.enterprise-th-sort",
    );
    expect(sortHeaders.length).toBe(component.sortConfigs.length);

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
    const firstTh = fixture.nativeElement.querySelector(
      "th.enterprise-th-sort",
    );
    expect(firstTh.getAttribute("aria-sort")).toBe("ascending");

    const secondTh = fixture.nativeElement.querySelectorAll(
      "th.enterprise-th-sort",
    )[1];
    expect(secondTh.getAttribute("aria-sort")).toBe("none");
  });

  it("should toggle aria-sort when the header button is activated", () => {
    const firstButton: HTMLButtonElement = fixture.nativeElement
      .querySelectorAll("th.enterprise-th-sort")[0]
      .querySelector("button");

    firstButton.click();
    fixture.detectChanges();
    expect(component.sortDir()).toBe("desc");
    expect(
      fixture.nativeElement
        .querySelectorAll("th.enterprise-th-sort")[0]
        .getAttribute("aria-sort"),
    ).toBe("descending");
  });

  it("should derive orders count from orders data", () => {
    const [firstDoctor, secondDoctor] = component.filtered();
    expect(firstDoctor.id).toBe("d-1");
    expect(firstDoctor.ordersCount).toBe(2);
    expect(secondDoctor.id).toBe("d-2");
    expect(secondDoctor.ordersCount).toBe(1);
  });
});
