import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { LoginComponent } from './login.component';
import { Router } from '@angular/router';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default email value', () => {
    expect(component.email()).toBe('jessica.ruiz@dentalab.com');
  });

  it('should have default password value', () => {
    expect(component.password()).toBe('••••••••••');
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword()).toBeFalse();
    component.togglePasswordVisibility();
    expect(component.showPassword()).toBeTrue();
    expect(component.passwordType).toBe('text');
    component.togglePasswordVisibility();
    expect(component.showPassword()).toBeFalse();
    expect(component.passwordType).toBe('password');
  });

  it('should call router.navigate on successful login', async () => {
    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', new Event('submit'));
    await fixture.whenStable();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should show loading state during login', async () => {
    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', new Event('submit'));
    fixture.detectChanges();
    expect(component.loading()).toBeTrue();
    const button = fixture.debugElement.query(By.css('app-button'));
    expect(button.componentInstance.loading()).toBeTrue();
  });

  it('should render dental image on desktop', () => {
    const imageDiv = fixture.debugElement.query(By.css('div[style*="background-image"]'));
    expect(imageDiv).toBeTruthy();
  });

  it('should display stats', () => {
    const stats = fixture.debugElement.queryAll(By.css('.stat-card'));
    expect(stats.length).toBe(3);
  });
});