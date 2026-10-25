import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideRouter } from "@angular/router";
import { ReportsComponent } from "./reports.component";
import { BillingDataService } from "@core/services/billing-data.service";
import { CaseDataService } from "@core/services/case-data.service";
import { OrderDataService } from "@core/services/order-data.service";
import { ReportsDataService } from "@core/services/reports-data.service";
import { signal } from "@angular/core";

const reportData = {
  monthlyRevenue: [
    { month: "Jan", revenue: 100 },
    { month: "Feb", revenue: 133 },
  ],
  restorationBreakdown: [{ name: "Crown", value: 100 }],
  turnaround: [{ day: "Mon", days: 1 }],
  workflowShare: [{ stage: "New", count: 1, percent: 100 }],
};

describe("ReportsComponent", () => {
  let component: ReportsComponent;
  let fixture: ComponentFixture<ReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: OrderDataService,
          useValue: { orders: signal([]), loadOrders: jasmine.createSpy() },
        },
        {
          provide: CaseDataService,
          useValue: { cases: signal([]), loadCases: jasmine.createSpy() },
        },
        {
          provide: BillingDataService,
          useValue: { records: signal([]), loadRecords: jasmine.createSpy() },
        },
        {
          provide: ReportsDataService,
          useValue: {
            reports: signal(reportData),
            loadReports: jasmine.createSpy(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should build chart datasets from reports data", () => {
    const revenueData = component.monthlyRevenueChartData();
    const breakdownData = component.restorationBreakdownChartData();
    const turnaroundData = component.turnaroundChartData();

    expect(revenueData.labels?.length).toBeGreaterThan(0);
    expect(revenueData.datasets[0].data.length).toBe(
      component.monthlyRevenue.length,
    );

    expect(breakdownData.labels?.length).toBe(
      component.restorationBreakdown.length,
    );
    expect(breakdownData.datasets[0].data.length).toBe(
      component.restorationBreakdown.length,
    );

    expect(turnaroundData.labels?.length).toBe(component.turnaround.length);
    expect(turnaroundData.datasets[0].data.length).toBe(
      component.turnaround.length,
    );
  });

  it("should expose absolute revenue momentum and workflow stage labeling", () => {
    expect(component.revenueGrowthPercent()).toBe(33);
    const firstWorkflowItem = component.workflowContribution()[0];
    expect(firstWorkflowItem.displayStage).toBe("New Revenue Design");
    expect(component.workflowProgressColor("Production", 38)).toBe("#F59E0B");
  });
});
