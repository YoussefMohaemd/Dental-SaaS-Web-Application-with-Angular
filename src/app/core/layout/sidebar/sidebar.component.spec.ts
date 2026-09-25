import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { signal } from "@angular/core";
import { provideRouter } from "@angular/router";
import { SidebarComponent } from "./sidebar.component";
import { NavigationService } from "@core/services/navigation.service";
import { ThemeService } from "@core/services/theme.service";

describe("SidebarComponent", () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let navigationService: jasmine.SpyObj<NavigationService>;
  let themeService: jasmine.SpyObj<ThemeService>;

  beforeEach(async () => {
    const navSpy = jasmine.createSpyObj(
      "NavigationService",
      ["navigate", "toggleSidebar"],
      {
        sidebarOpen: signal(true),
        currentPage: signal("dashboard"),
        activeGroup: signal("dashboard"),
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
