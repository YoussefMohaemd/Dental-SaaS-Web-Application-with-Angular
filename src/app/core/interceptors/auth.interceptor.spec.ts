import {
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
  HttpResponse,
} from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { Observable, of } from "rxjs";
import { authInterceptor } from "./auth.interceptor";

describe("authInterceptor", () => {
  afterEach(() => {
    localStorage.removeItem("dentalab-auth-token");
  });

  it("attaches an Authorization header when a token exists", () => {
    localStorage.setItem("dentalab-auth-token", "token-value");

    const next = jasmine
      .createSpy("next")
      .and.callFake(
        (request: HttpRequest<unknown>): Observable<HttpEvent<unknown>> =>
          of(new HttpResponse({ status: 200, url: request.url })),
      ) as jasmine.Spy<HttpHandlerFn>;
    const request = new HttpRequest("GET", "/api/orders");

    TestBed.runInInjectionContext(() => authInterceptor(request, next)).subscribe();

    const forwarded = next.calls.mostRecent().args[0] as HttpRequest<unknown>;
    expect(forwarded.headers.has("Authorization")).toBeTrue();
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

    TestBed.runInInjectionContext(() => authInterceptor(request, next)).subscribe();

    const forwarded = next.calls.mostRecent().args[0] as HttpRequest<unknown>;
    expect(forwarded.headers.has("Authorization")).toBeFalse();
  });
});
