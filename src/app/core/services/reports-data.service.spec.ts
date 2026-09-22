import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ReportsDataService } from './reports-data.service';

describe('ReportsDataService', () => {
  let service: ReportsDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ReportsDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should expose fallback chart data before the request resolves', () => {
    expect(service.reports().monthlyRevenue.length).toBe(6);
    expect(service.reports().restorationBreakdown.length).toBe(6);
    expect(service.reports().turnaround.length).toBe(7);
    expect(service.reports().workflowShare.length).toBe(6);
  });

  it('should replace chart data when JSON loads', () => {
    const payload = {
      monthlyRevenue: [{ month: 'Jan', revenue: 1000 }],
      restorationBreakdown: [{ name: 'Crown', value: 100 }],
      turnaround: [{ day: 'Mon', days: 1 }],
      workflowShare: [{ stage: 'New', count: 1, percent: 100 }]
    };
    httpMock.expectOne('/data/reports.json').flush(payload);
    expect(service.reports().monthlyRevenue).toEqual(payload.monthlyRevenue);
    expect(service.loading()).toBeFalse();
  });
});
