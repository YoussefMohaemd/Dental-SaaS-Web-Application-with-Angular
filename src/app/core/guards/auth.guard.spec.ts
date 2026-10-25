import { PLATFORM_ID } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { AuthGuard } from "./auth.guard";
import { NavigationService } from "@core/services/navigation.service";
import { AuthService } from "@core/services/auth.service";
import { signal } from "@angular/core";
import { Observable, of } from "rxjs";

describe("AuthGuard", () => {
  let guard: AuthGuard;
  let router: jasmine.SpyObj<Router>;
  let authenticated: ReturnType<typeof signal<boolean>>;

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>("Router", ["navigate"]);
    authenticated = signal(false);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: Router, useValue: router },
        { provide: NavigationService, useValue: {} },
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: authenticated.asReadonly(),
            ensureSession: () => of(false),
          },
        },
        { provide: PLATFORM_ID, useValue: "browser" },
      ],
    });

    guard = TestBed.inject(AuthGuard);
  });

  it("allows navigation when the auth service reports an authenticated session", () => {
    authenticated.set(true);
    expect(guard.canActivate()).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it("redirects to /login when the auth service reports no session", () => {
    let result: boolean | undefined;
    (guard.canActivate() as Observable<boolean>).subscribe(
      (value) => (result = value),
    );
    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(["/login"]);
  });
});
