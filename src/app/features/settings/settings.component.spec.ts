import { ComponentFixture, TestBed } from "@angular/core/testing";
import { SettingsComponent } from "./settings.component";
import { AuthService, AuthenticatedUser } from "@core/services/auth.service";
import { signal } from "@angular/core";
import { of } from "rxjs";

describe("SettingsComponent", () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  const user: AuthenticatedUser = {
    userId: "user-1",
    tenantId: "tenant-1",
    fullName: "Amina Hassan",
    email: "amina@example.com",
    roles: ["Administrator"],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            user: signal(user),
            isAuthenticated: signal(true),
            loadCurrentUser: () => of(user),
            changePassword: jasmine.createSpy("changePassword").and.returnValue(
              of(void 0),
            ),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should switch sections", () => {
    component.setSection("security");
    expect(component.section()).toBe("security");
  });

  it("should toggle notification preferences", () => {
    const initial = component.notificationPrefs().orderUpdates;
    component.togglePreference("orderUpdates");
    expect(component.notificationPrefs().orderUpdates).toBe(!initial);
  });

  it("should display the authenticated user's account details", () => {
    expect(component.accountName()).toBe("Amina Hassan");
    expect(component.accountInitials()).toBe("AH");
    expect(component.profileForm.getRawValue()).toEqual(
      jasmine.objectContaining({
        firstName: "Amina",
        lastName: "Hassan",
        email: "amina@example.com",
        role: "Administrator",
      }),
    );
  });

  it("should submit a valid password change", () => {
    const auth = TestBed.inject(AuthService);
    const changePassword = auth.changePassword as jasmine.Spy;
    changePassword.and.returnValue(of(void 0));
    component.securityForm.setValue({
      currentPassword: "old-password",
      newPassword: "new-password",
      confirmPassword: "new-password",
    });

    component.setSection("security");
    component.saveChanges();

    expect(changePassword).toHaveBeenCalledWith({
      currentPassword: "old-password",
      newPassword: "new-password",
    });
  });
});
