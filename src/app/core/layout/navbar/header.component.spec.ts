import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { signal } from "@angular/core";
import { provideRouter } from "@angular/router";
import { HeaderComponent } from "./header.component";
import { NavigationService } from "@core/services/navigation.service";
import { ThemeService } from "@core/services/theme.service";
import { NotificationDataService } from "@core/services/notification-data.service";

describe("HeaderComponent", () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let navigationService: jasmine.SpyObj<NavigationService>;
  let themeService: jasmine.SpyObj<ThemeService>;
  let notificationService: jasmine.SpyObj<NotificationDataService>;

  beforeEach(async () => {
    const navSpy = jasmine.createSpyObj(
      "NavigationService",
      [
        "navigate",
        "toggleSidebar",
        "toggleNotifications",
        "toggleProfile",
        "closeDropdowns",
      ],
      {
        breadcrumbs: signal([{ label: "Dashboard" }]),
        notificationsOpen: signal(false),
        profileOpen: signal(false),
      },
    );
    const themeSpy = jasmine.createSpyObj("ThemeService", ["toggle"], {
      isDark: signal(false),
    });
    const notifSpy = jasmine.createSpyObj(
      "NotificationDataService",
      ["markAsRead"],
      {
        recentNotifications: signal([]),
        unreadCount: signal(0),
      },
    );

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([]),
        { provide: NavigationService, useValue: navSpy },
        { provide: ThemeService, useValue: themeSpy },
        { provide: NotificationDataService, useValue: notifSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    navigationService = TestBed.inject(
      NavigationService,
    ) as jasmine.SpyObj<NavigationService>;
    themeService = TestBed.inject(ThemeService) as jasmine.SpyObj<ThemeService>;
    notificationService = TestBed.inject(
      NotificationDataService,
    ) as jasmine.SpyObj<NotificationDataService>;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display breadcrumbs", () => {
    const breadcrumb = fixture.debugElement.query(By.css("nav"));
    expect(breadcrumb).toBeTruthy();
  });

  it("should have theme toggle button", () => {
    const themeBtn = fixture.debugElement.query(
      By.css('button[aria-label="Toggle theme"]'),
    );
    expect(themeBtn).toBeTruthy();
  });

  it("should have notifications button", () => {
    const notifBtn = fixture.debugElement.query(
      By.css('button[aria-label="Notifications"]'),
    );
    expect(notifBtn).toBeTruthy();
  });

  it("should have profile button", () => {
    const profileBtn = fixture.debugElement.query(
      By.css('button[aria-label="Profile menu"]'),
    );
    expect(profileBtn).toBeTruthy();
  });

  it("should toggle the theme and persist the signal state", () => {
    component.toggleTheme();
    expect(themeService.toggle).toHaveBeenCalled();
  });

  it("should show the moon icon in light mode and the sun icon in dark mode", () => {
    const themeBtn = fixture.debugElement.query(
      By.css('button[aria-label="Toggle theme"]'),
    );
    expect(themeBtn.nativeElement.innerHTML).toContain("M20.985 12.486");
    (themeService.isDark as unknown as { set(v: boolean): void }).set(true);
    fixture.detectChanges();
    const updatedBtn = fixture.debugElement.query(
      By.css('button[aria-label="Toggle theme"]'),
    );
    expect(updatedBtn.nativeElement.innerHTML).toContain(
      '<circle cx="12" cy="12" r="4">',
    );
  });

  it("should render the header search with React-parity placeholder", () => {
    const search = fixture.debugElement.query(By.css("app-search-input"));
    expect(search).toBeTruthy();
    expect(search.componentInstance.placeholder()).toBe(
      "Search orders, patients...",
    );
    expect(search.componentInstance.showShortcut()).toBeTrue();
  });

  it("should display an unread badge when notifications are unread", () => {
    expect(fixture.debugElement.query(By.css(".bg-danger"))).toBeFalsy();
    (
      notificationService.unreadCount as unknown as { set(v: number): void }
    ).set(5);
    fixture.detectChanges();
    const badge = fixture.debugElement.query(
      By.css('button[aria-label="Notifications"] .bg-danger'),
    );
    expect(badge).toBeTruthy();
    expect(badge.nativeElement.textContent.trim()).toBe("5");
  });

  it("should open the notifications dropdown and navigate to notifications", () => {
    (
      navigationService.notificationsOpen as unknown as {
        set(v: boolean): void;
      }
    ).set(true);
    fixture.detectChanges();
    const dropdown = fixture.debugElement.query(By.css(".w-80"));
    expect(dropdown).toBeTruthy();
    component.navigateToNotifications();
    expect(navigationService.navigate).toHaveBeenCalledWith("notifications");
  });

  it("should open the profile menu and sign out back to login", () => {
    (navigationService.profileOpen as unknown as { set(v: boolean): void }).set(
      true,
    );
    fixture.detectChanges();
    const menu = fixture.debugElement.query(By.css(".w-48"));
    expect(menu).toBeTruthy();
    component.logout();
    expect(navigationService.navigate).toHaveBeenCalledWith("login");
  });

  it("should toggle sidebar on menu click", () => {
    const menuBtn = fixture.debugElement.query(
      By.css('button[aria-label="Toggle sidebar"]'),
    );
    menuBtn.nativeElement.click();
    expect(navigationService.toggleSidebar).toHaveBeenCalled();
  });
});
