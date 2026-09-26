import { PLATFORM_ID } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { AuthGuard } from "./auth.guard";
import { NavigationService } from "@core/services/navigation.service";

describe("AuthGuard", () => {
  let guard: AuthGuard;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>("Router", ["navigate"]);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: Router, useValue: router },
        { provide: NavigationService, useValue: {} },
        { provide: PLATFORM_ID, useValue: "browser" },
      ],
    });

    guard = TestBed.inject(AuthGuard);
    localStorage.removeItem("dentalab-auth");
  });

  afterEach(() => {
    localStorage.removeItem("dentalab-auth");
  });

  it("allows navigation when an auth marker exists in localStorage", () => {
    localStorage.setItem("dentalab-auth", "true");

    expect(guard.canActivate()).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it("redirects to /login when auth marker is missing", () => {
    expect(guard.canActivate()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(["/login"]);
  });
});
