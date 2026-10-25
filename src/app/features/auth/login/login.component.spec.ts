import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { LoginComponent } from "./login.component";
import { Router } from "@angular/router";
import { AuthService } from "@core/services/auth.service";
import { of } from "rxjs";

describe("LoginComponent", () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj("Router", ["navigate"]);
    const authServiceSpy = jasmine.createSpyObj<AuthService>("AuthService", [
      "login",
    ]);
    authServiceSpy.login.and.returnValue(
      of({
        userId: "user-id",
        tenantId: "tenant-id",
        fullName: "Test User",
        email: "test@example.com",
        roles: ["admin"],
      }),
    );

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should start with an empty email value", () => {
    expect(component.email()).toBe("");
  });

  it("should toggle password visibility", () => {
    expect(component.showPassword()).toBeFalse();
    component.togglePasswordVisibility();
    expect(component.showPassword()).toBeTrue();
    expect(component.passwordType).toBe("text");
    component.togglePasswordVisibility();
    expect(component.showPassword()).toBeFalse();
    expect(component.passwordType).toBe("password");
  });

  it("should call router.navigate on successful login", async () => {
    component.email.set("test@example.com");
    component.password.set("password");
    const form = fixture.debugElement.query(By.css("form"));
    form.triggerEventHandler("ngSubmit", new Event("submit"));
    await new Promise((resolve) => setTimeout(resolve, 900));
    expect(router.navigate).toHaveBeenCalledWith(["/dashboard"]);
  });

  it("should show loading state during login", async () => {
    const form = fixture.debugElement.query(By.css("form"));
    form.triggerEventHandler("ngSubmit", new Event("submit"));
    fixture.detectChanges();
    expect(component.loading()).toBeTrue();
    const button = fixture.debugElement.query(By.css("app-button"));
    expect(button.componentInstance.loading()).toBeTrue();
    await new Promise((resolve) => setTimeout(resolve, 900));
  });

  it("should render email and password inputs with icon padding so icons never overlap text", () => {
    const inputs = fixture.debugElement.queryAll(By.css("app-input"));
    expect(inputs.length).toBe(2);
    for (const input of inputs) {
      expect(input.componentInstance.iconStart()).toBeTrue();
    }
    const passwordInput = inputs[1];
    expect(passwordInput.componentInstance.iconEnd()).toBeTrue();
    expect(passwordInput.componentInstance.type()).toBe("password");
  });

  it("should render visible submit button text with primary styling", () => {
    const button = fixture.debugElement.query(By.css("app-button"));
    expect(button).toBeTruthy();
    expect(button.componentInstance.variant()).toBe("primary");
    const nativeButton = button.query(By.css("button"));
    const classes = (
      nativeButton.nativeElement.getAttribute("class") ?? ""
    ).split(/\s+/);
    expect(classes).toContain("bg-primary");
    expect(classes).toContain("text-primary-foreground");
    expect(nativeButton.nativeElement.textContent.trim()).toContain("Sign in");
  });

  it("should toggle password visibility and keep the value readable", () => {
    component.password.set("password");
    const toggle = fixture.debugElement.query(
      By.css('button[aria-label="Toggle password visibility"]'),
    );
    expect(toggle).toBeTruthy();
    toggle.nativeElement.click();
    fixture.detectChanges();
    expect(component.showPassword()).toBeTrue();
    expect(component.passwordType).toBe("text");
    const passwordInput = fixture.debugElement.queryAll(By.css("app-input"))[1];
    expect(passwordInput.componentInstance.type()).toBe("text");
    expect(component.password()).toBeTruthy();
  });

  it("should disable the submit button while signing in", () => {
    const form = fixture.debugElement.query(By.css("form"));
    form.triggerEventHandler("ngSubmit", new Event("submit"));
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css("app-button"));
    expect(button.componentInstance.disabled()).toBeTrue();
    expect(button.componentInstance.isDisabled()).toBeTrue();
  });

  it("should render dental image on desktop", () => {
    const imageDiv = fixture.debugElement.query(
      By.css('div[style*="background-image"]'),
    );
    expect(imageDiv).toBeTruthy();
  });

  it("should display stats", () => {
    const stats = fixture.debugElement.queryAll(By.css(".stat-card"));
    expect(stats.length).toBe(3);
  });
});
