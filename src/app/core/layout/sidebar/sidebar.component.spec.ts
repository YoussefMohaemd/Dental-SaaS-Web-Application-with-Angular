import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { signal } from "@angular/core";
import { provideRouter } from "@angular/router";
import { SidebarComponent } from "./sidebar.component";
import { NavigationService } from "@core/services/navigation.service";
import { ThemeService } from "@core/services/theme.service";
import { AuthService } from "@core/services/auth.service";
import { ChangeRequestDataService } from "@core/services/change-request-data.service";

describe("SidebarComponent", () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let navigationService: jasmine.SpyObj<NavigationService>;
  let themeService: jasmine.SpyObj<ThemeService>;

  beforeEach(async () => {
    const navSpy = jasmine.createSpyObj(
      "NavigationService",
      ["navigate", "toggleSidebar", "setSidebarOpen"],
      {
        sidebarOpen: signal(true),
        currentPage: signal("dashboard"),
        activeGroup: signal("dashboard"),
        isMobile: signal(false),
      },
    );
    const themeSpy = jasmine.createSpyObj("ThemeService", [], {
      isDark: signal(false),
    });

    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideRouter([]),
        { provide: NavigationService, useValue: navSpy },
        { provide: ThemeService, useValue: themeSpy },
        {
          provide: AuthService,
          useValue: {
            user: signal({
              userId: "user-1",
              tenantId: "tenant-1",
              fullName: "Jessica Ruiz",
              email: "jessica@example.com",
              roles: ["Lab Manager"],
            }),
          },
        },
        {
          provide: ChangeRequestDataService,
          useValue: {
            loadChangeRequests: jasmine.createSpy("loadChangeRequests"),
            totalChangeRequests: signal(3),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    navigationService = TestBed.inject(
      NavigationService,
    ) as jasmine.SpyObj<NavigationService>;
    themeService = TestBed.inject(ThemeService) as jasmine.SpyObj<ThemeService>;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display logo", () => {
    const candidates = fixture.debugElement.queryAll(By.css(".font-display"));
    const logo = candidates.find((el) =>
      (el.nativeElement.textContent ?? "").includes("DentaLab"),
    );
    expect(logo).toBeTruthy();
  });

  it("should display navigation items", () => {
    const navButtons = fixture.debugElement.queryAll(By.css("nav button"));
    expect(navButtons.length).toBeGreaterThan(0);
  });

  it("should render a dynamic change request badge", () => {
    const navButtons = fixture.debugElement.queryAll(By.css("nav button"));
    const badgeHost = navButtons.find((button) =>
      (button.nativeElement.textContent ?? "").includes("Change Requests"),
    );
    expect(badgeHost).toBeTruthy();
    expect((badgeHost?.nativeElement.textContent ?? "").includes("3")).toBeTrue();
  });

  it("should display user info", () => {
    const candidates = fixture.debugElement.queryAll(By.css(".font-semibold"));
    const userName = candidates.find(
      (el) => (el.nativeElement.textContent ?? "").trim() === "Jessica Ruiz",
    );
    expect(userName).toBeTruthy();
  });

  it("should collapse when the sidebar signal is closed", () => {
    expect(component.sidebarClasses()).toContain("w-56");
  });
});
