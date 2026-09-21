import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SidebarComponent } from './sidebar.component';
import { NavigationService } from '../../../core/services/navigation.service';
import { ThemeService } from '../../../core/services/theme.service';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let navigationService: jasmine.SpyObj<NavigationService>;
  let themeService: jasmine.SpyObj<ThemeService>;

  beforeEach(async () => {
    const navSpy = jasmine.createSpyObj('NavigationService', ['navigate'], {
      sidebarOpen: { asReadonly: () => ({ set: () => {}, update: () => {} }) },
      currentPage: { asReadonly: () => 'dashboard' },
      activeGroup: { asReadonly: () => 'dashboard' }
    });
    const themeSpy = jasmine.createSpyObj('ThemeService', [], {
      isDark: { asReadonly: () => false }
    });

    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        { provide: NavigationService, useValue: navSpy },
        { provide: ThemeService, useValue: themeSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    navigationService = TestBed.inject(NavigationService) as jasmine.SpyObj<NavigationService>;
    themeService = TestBed.inject(ThemeService) as jasmine.SpyObj<ThemeService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display logo', () => {
    const logo = fixture.debugElement.query(By.css('.font-display'));
    expect(logo.nativeElement.textContent.trim()).toContain('DentaLab');
  });

  it('should display navigation items', () => {
    const navButtons = fixture.debugElement.queryAll(By.css('nav button'));
    expect(navButtons.length).toBeGreaterThan(0);
  });

  it('should display user info', () => {
    const userName = fixture.debugElement.query(By.css('.font-semibold'));
    expect(userName.nativeElement.textContent.trim()).toBe('Jessica Ruiz');
  });
});