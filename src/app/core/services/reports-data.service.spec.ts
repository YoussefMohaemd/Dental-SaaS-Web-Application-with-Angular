import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { ReportsDataService } from "./reports-data.service";
import { ApiEndpoint } from "@core/enum/api.endpoint";

describe("ReportsDataService", () => {
  let service: ReportsDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReportsDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should expose an empty chart state when the API request fails", () => {
    service.loadReports();
    httpMock
      .expectOne(ApiEndpoint.REPORTS_OVERVIEW)
      .flush(null, { status: 500, statusText: "Server Error" });
    expect(service.reports().monthlyRevenue.length).toBe(0);
    expect(service.reports().restorationBreakdown.length).toBe(0);
    expect(service.reports().turnaround.length).toBe(0);
    expect(service.reports().workflowShare.length).toBe(0);
  });

  it("should expose chart data returned by the API", () => {
    const payload = {
      monthlyRevenue: [{ month: "Jan", revenue: 1000 }],
      restorationBreakdown: [{ name: "Crown", value: 100 }],
      turnaround: [{ day: "Mon", days: 1 }],
      workflowShare: [{ stage: "New", count: 1, percent: 100 }],
    };
    service.loadReports();
    httpMock.expectOne(ApiEndpoint.REPORTS_OVERVIEW).flush({ data: payload });
    expect(service.reports().monthlyRevenue).toEqual(payload.monthlyRevenue);
    expect(service.loading()).toBeFalse();
  });
});
