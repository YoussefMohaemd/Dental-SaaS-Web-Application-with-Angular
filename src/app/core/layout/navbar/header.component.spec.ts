import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HeaderComponent } from './header.component';
import { NavigationService } from '../../../core/services/navigation.service';
import { ThemeService } from '../../../core/services/theme.service';
import { NotificationDataService } from '../../../core/services/notification-data.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let navigationService: jasmine.SpyObj<NavigationService>;
  let themeService: jasmine.SpyObj<ThemeService>;
  let notificationService: jasmine.SpyObj<NotificationDataService>;

  beforeEach(async () => {
    const navSpy = jasmine.createSpyObj('NavigationService', ['navigate', 'toggleSidebar', 'toggleNotifications', 'toggleProfile', 'closeDropdowns'], {
      breadcrumbs: { asReadonly: () => [{ label: 'Dashboard' }] },
      notificationsOpen: { asReadonly: () => false },
      profileOpen: { asReadonly: () => false }
    });
    const themeSpy = jasmine.createSpyObj('ThemeService', ['toggle'], {
      isDark: { asReadonly: () => false }
    });
    const notifSpy = jasmine.createSpyObj('NotificationDataService', ['markAsRead'], {
      recentNotifications: { asReadonly: () => [] },
      unreadCount: { asReadonly: () => 0 }
    });

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        { provide: NavigationService, useValue: navSpy },
        { provide: ThemeService, useValue: themeSpy },
        { provide: NotificationDataService, useValue: notifSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    navigationService = TestBed.inject(NavigationService) as jasmine.SpyObj<NavigationService>;
    themeService = TestBed.inject(ThemeService) as jasmine.SpyObj<ThemeService>;
    notificationService = TestBed.inject(NotificationDataService) as jasmine.SpyObj<NotificationDataService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display breadcrumbs', () => {
    const breadcrumb = fixture.debugElement.query(By.css('nav'));
    expect(breadcrumb).toBeTruthy();
  });

  it('should have theme toggle button', () => {
    const themeBtn = fixture.debugElement.query(By.css('button[aria-label="Toggle theme"]'));
    expect(themeBtn).toBeTruthy();
  });

  it('should have notifications button', () => {
    const notifBtn = fixture.debugElement.query(By.css('button[aria-label="Notifications"]'));
    expect(notifBtn).toBeTruthy();
  });

  it('should have profile button', () => {
    const profileBtn = fixture.debugElement.query(By.css('button[aria-label="Profile menu"]'));
    expect(profileBtn).toBeTruthy();
  });
});