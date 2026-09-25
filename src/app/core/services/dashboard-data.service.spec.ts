import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { DashboardDataService } from "./dashboard-data.service";

describe("DashboardDataService", () => {
  let service: DashboardDataService;
  let httpMock: HttpTestingController;

  const payload = {
    weeks: [
      {
        weekStart: "2024-12-09",
        weekLabel: "W50",
        days: [
          { day: "Mon", orders: 10, completed: 8 },
          { day: "Tue", orders: 12, completed: 9 },
          { day: "Wed", orders: 9, completed: 7 },
          { day: "Thu", orders: 15, completed: 12 },
          { day: "Fri", orders: 11, completed: 10 },
          { day: "Sat", orders: 6, completed: 5 },
          { day: "Sun", orders: 4, completed: 4 },
        ],
      },
      {
        weekStart: "2024-12-16",
        weekLabel: "W51",
        days: [
          { day: "Mon", orders: 14, completed: 11 },
          { day: "Tue", orders: 18, completed: 15 },
          { day: "Wed", orders: 12, completed: 10 },
          { day: "Thu", orders: 21, completed: 18 },
          { day: "Fri", orders: 16, completed: 13 },
          { day: "Sat", orders: 8, completed: 7 },
          { day: "Sun", orders: 5, completed: 5 },
        ],
      },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DashboardDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should create", () => {
    expect(service).toBeTruthy();
    httpMock.expectOne("data/dashboard-volume.json").flush(payload);
  });

  it("should expose the current week from dashboard-volume.json", () => {
    httpMock.expectOne("data/dashboard-volume.json").flush(payload);
    expect(service.weeks().length).toBe(2);
    expect(service.currentWeek().weekLabel).toBe("W51");
    expect(service.currentDays().length).toBe(7);
    expect(service.weekMax()).toBe(21);
  });

  it("should fall back to built-in data when the JSON is unavailable", () => {
    httpMock.expectOne("data/dashboard-volume.json").flush(null);
    expect(service.currentDays().length).toBe(7);
    expect(service.weekMax()).toBe(21);
  });
});
