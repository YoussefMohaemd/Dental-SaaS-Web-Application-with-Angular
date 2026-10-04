import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideRouter } from "@angular/router";
import { ReportsComponent } from "./reports.component";

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
