import {
  HttpClient,
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
  HttpResponse,
  provideHttpClient,
  withInterceptors,
} from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { Observable, of } from "rxjs";
import { ApiEndpoint } from "@core/enum/api.endpoint";
import { authInterceptor } from "./auth.interceptor";

describe("authInterceptor", () => {
  const user = {
    userId: "user-id",
    tenantId: "tenant-id",
    fullName: "Test User",
    email: "test@example.com",
    roles: ["admin"],
  };
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    localStorage.removeItem("dentalab-auth-token");
    localStorage.removeItem("dentalab-auth-user");
    localStorage.removeItem("dentalab-auth");
    localStorage.removeItem("dentalab-tenant-id");
    sessionStorage.removeItem("dentalab-session-token");
    sessionStorage.removeItem("dentalab-session-user");
    sessionStorage.removeItem("dentalab-session-tenant-id");
    httpMock.verify();
  });

  it("attaches an Authorization header when a token exists", () => {
    sessionStorage.setItem("dentalab-session-token", "token-value");
    sessionStorage.setItem("dentalab-session-user", JSON.stringify(user));

    const next = jasmine
      .createSpy("next")
      .and.callFake(
        (request: HttpRequest<unknown>): Observable<HttpEvent<unknown>> =>
          of(new HttpResponse({ status: 200, url: request.url })),
      ) as jasmine.Spy<HttpHandlerFn>;
    const request = new HttpRequest("GET", "/api/orders");

    TestBed.runInInjectionContext(() =>
      authInterceptor(request, next),
    ).subscribe();

    const forwarded = next.calls.mostRecent().args[0] as HttpRequest<unknown>;
    expect(forwarded.headers.get("Authorization")).toBe("Bearer token-value");
  });

  it("forwards the original request when no token exists", () => {
    localStorage.removeItem("dentalab-auth-token");

    const next = jasmine
      .createSpy("next")
      .and.callFake(
        (request: HttpRequest<unknown>): Observable<HttpEvent<unknown>> =>
          of(new HttpResponse({ status: 200, url: request.url })),
      ) as jasmine.Spy<HttpHandlerFn>;
    const request = new HttpRequest("GET", "/api/orders");

    TestBed.runInInjectionContext(() =>
      authInterceptor(request, next),
    ).subscribe();

    const forwarded = next.calls.mostRecent().args[0] as HttpRequest<unknown>;
    expect(forwarded.headers.has("Authorization")).toBeFalse();
  });

  it("refreshes an expired access token and retries the original request", () => {
    sessionStorage.setItem("dentalab-session-token", "expired-token");
    sessionStorage.setItem("dentalab-session-user", JSON.stringify(user));

    const http = TestBed.inject(HttpClient);
    let responseBody: unknown;
    http.get("/api/v1/orders").subscribe((response) => {
      responseBody = response;
    });

    const initialRequest = httpMock.expectOne("/api/v1/orders");
    expect(initialRequest.request.headers.get("Authorization")).toBe(
      "Bearer expired-token",
    );
    initialRequest.flush(
      { error: { code: "UNAUTHORIZED" } },
      { status: 401, statusText: "Unauthorized" },
    );

    const refreshRequest = httpMock.expectOne(ApiEndpoint.AUTH_REFRESH);
    expect(refreshRequest.request.withCredentials).toBeTrue();
    refreshRequest.flush({
      data: {
        accessToken: "fresh-token",
        user,
      },
    });

    const retriedRequest = httpMock.expectOne("/api/v1/orders");
    expect(retriedRequest.request.headers.get("Authorization")).toBe(
      "Bearer fresh-token",
    );
    retriedRequest.flush({ data: [] });

    expect(responseBody).toEqual({ data: [] });
  });
});
