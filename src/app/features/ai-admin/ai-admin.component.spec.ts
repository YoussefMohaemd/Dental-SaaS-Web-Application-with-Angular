import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { AiAdminComponent } from "./ai-admin.component";
import { AssistantDataService } from "@core/services/assistant-data.service";

describe("AiAdminComponent", () => {
  let fixture: ComponentFixture<AiAdminComponent>;

  const catalogServices = [
    {
      serviceId: "aligner-plan",
      name: "Aligner Plan",
      description: "Digital plan",
      basePrice: 1200,
      turnaroundDays: 3,
      scanRequirements: ["Upper scan"],
      isActive: true,
      sortOrder: 1,
    },
    {
      serviceId: "crown-design",
      name: "Crown Design",
      description: "Single crown",
      basePrice: 900,
      turnaroundDays: 2,
      scanRequirements: ["Upper scan", "Bite"],
      isActive: true,
      sortOrder: 2,
    },
  ];

  const assistantDataServiceMock = {
    listAdminConversations$: jasmine
      .createSpy("listAdminConversations$")
      .and.returnValue(
        of({
          items: [
            {
              id: "conv-1",
              ownerUserId: "user-1",
              ownerName: "Dr. Omar",
              ownerRoles: ["doctor"],
              title: "Case update",
              status: "active" as const,
              createdAt: "2026-11-22T07:00:00.000Z",
              updatedAt: "2026-11-22T07:10:00.000Z",
              preview: "Any update on crown design?",
            },
          ],
          total: 1,
          page: 1,
          pageSize: 30,
        }),
      ),
    listAdminCatalogServices$: jasmine
      .createSpy("listAdminCatalogServices$")
      .and.returnValue(of(catalogServices)),
    getAdminCompanyProfile$: jasmine
      .createSpy("getAdminCompanyProfile$")
      .and.returnValue(
        of({
          name: "Dental Lab",
          about: "Lab profile",
          email: "lab@example.com",
          phone: "01000000000",
          address: "Cairo",
          workingHours: "9-5",
          submissionStandards: ["Full arch scan"],
        }),
      ),
    getAdminConversation$: jasmine
      .createSpy("getAdminConversation$")
      .and.returnValue(
        of({
          conversation: {
            id: "conv-1",
            ownerUserId: "user-1",
            title: "Case update",
            status: "active" as const,
            createdAt: "2026-11-22T07:00:00.000Z",
            updatedAt: "2026-11-22T07:10:00.000Z",
            messages: [],
          },
          llmCalls: [],
        }),
      ),
    createAdminReview$: jasmine
      .createSpy("createAdminReview$")
      .and.returnValue(
        of({
          reviewId: "review-1",
          verdict: "correct" as const,
          createdAt: "2026-11-22T07:20:00.000Z",
        }),
      ),
    updateAdminCompanyProfile$: jasmine
      .createSpy("updateAdminCompanyProfile$")
      .and.returnValue(of({ success: true })),
    upsertAdminCatalogService$: jasmine
      .createSpy("upsertAdminCatalogService$")
      .and.returnValue(of({ success: true })),
    deactivateAdminCatalogService$: jasmine
      .createSpy("deactivateAdminCatalogService$")
      .and.returnValue(of({ success: true })),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiAdminComponent],
      providers: [
        {
          provide: AssistantDataService,
          useValue: assistantDataServiceMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AiAdminComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it("renders services cards without inline editor section", () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector(".services-grid")).withContext("services grid").not.toBeNull();
    expect(host.querySelector(".service-card")).withContext("service card").not.toBeNull();
    expect(host.querySelector(".services-editor")).withContext("inline editor removed").toBeNull();
  });

  it("opens new service popup and closes it on backdrop click", () => {
    const host = fixture.nativeElement as HTMLElement;
    const openButton = host.querySelector(".services-toolbar button.primary") as
      | HTMLButtonElement
      | null;
    expect(openButton).withContext("open modal button").not.toBeNull();
    openButton?.click();
    fixture.detectChanges();

    const backdrop = host.querySelector(".service-modal-backdrop") as HTMLElement | null;
    expect(backdrop).withContext("modal backdrop").not.toBeNull();
    backdrop?.click();
    fixture.detectChanges();
    expect(host.querySelector(".service-modal-backdrop")).toBeNull();
  });

  it("marks a selected service card after clicking it", () => {
    const host = fixture.nativeElement as HTMLElement;
    const cards = Array.from(
      host.querySelectorAll(".service-card .service-card__selection"),
    ) as HTMLButtonElement[];
    cards[1].click();
    fixture.detectChanges();
    const serviceCards = Array.from(host.querySelectorAll(".service-card")) as HTMLElement[];
    expect(serviceCards[1].classList.contains("is-selected")).toBeTrue();
    expect(cards[1].getAttribute("aria-pressed")).toBe("true");
    expect(cards[0].getAttribute("aria-pressed")).toBe("false");
  });

  it("opens edit popup from edit details and shows X close button", () => {
    const host = fixture.nativeElement as HTMLElement;
    const editButton = host.querySelector(".service-card__actions button") as
      | HTMLButtonElement
      | null;
    expect(editButton).not.toBeNull();
    editButton?.click();
    fixture.detectChanges();

    const editModal = host.querySelector(".service-modal-backdrop .service-modal") as
      | HTMLElement
      | null;
    expect(editModal).not.toBeNull();
    const closeButton = host.querySelector(".service-modal__icon-close") as
      | HTMLButtonElement
      | null;
    expect(closeButton).not.toBeNull();
    expect(closeButton?.textContent?.trim()).toBe("×");
  });
});
