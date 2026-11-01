import { TestBed } from "@angular/core/testing";
import { NavigationEnd, Router, Event as RouterEvent } from "@angular/router";
import { Subject } from "rxjs";
import { NavigationService } from "./navigation.service";

describe("NavigationService", () => {
  let service: NavigationService;
  let router: jasmine.SpyObj<Router>;
  let events$: Subject<RouterEvent>;

  beforeEach(() => {
    events$ = new Subject<RouterEvent>();
    router = jasmine.createSpyObj<Router>("Router", [
      "navigate",
      "navigateByUrl",
    ], {
      events: events$.asObservable(),
    });

    TestBed.configureTestingModule({
      providers: [
        NavigationService,
        {
          provide: Router,
          useValue: router,
        },
      ],
    });

    service = TestBed.inject(NavigationService);
  });

  it("should navigate ai page id to /ai", () => {
    service.navigate("ai" as any);
    expect(router.navigateByUrl).toHaveBeenCalledWith("/ai");
  });

  it("should resolve current page to ai from /ai url", () => {
    events$.next(new NavigationEnd(1, "/ai", "/ai"));
    expect(service.currentPage()).toBe("ai" as any);
  });
});
