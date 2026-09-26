import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { signal } from "@angular/core";
import { provideRouter } from "@angular/router";
import { DashboardComponent } from "./dashboard.component";
import { OrderDataService } from "@core/services/order-data.service";
import { CaseDataService } from "@core/services/case-data.service";
import { NavigationService } from "@core/services/navigation.service";
import { FormatUtils } from "@core/services/format-utils.service";
import { DashboardDataService } from "@core/services/dashboard-data.service";
import { NotificationDataService } from "@core/services/notification-data.service";
import { ChangeRequestDataService } from "@core/services/change-request-data.service";

describe("DashboardComponent", () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let navigationService: jasmine.SpyObj<NavigationService>;

  const volumeDays = [
    { day: "Mon", orders: 14, completed: 11 },
    { day: "Tue", orders: 18, completed: 15 },
    { day: "Wed", orders: 12, completed: 10 },
    { day: "Thu", orders: 21, completed: 18 },
    { day: "Fri", orders: 16, completed: 13 },
    { day: "Sat", orders: 8, completed: 7 },
    { day: "Sun", orders: 5, completed: 5 },
  ];

  beforeEach(async () => {
    const orderSpy = jasmine.createSpyObj("OrderDataService", [], {
      orders: signal([]),
      loading: signal(false),
      urgentOrdersCount: signal(0),
      completedTodayCount: signal(0),
    });
    const caseSpy = jasmine.createSpyObj("CaseDataService", [], {
      cases: signal([]),
    });
    const navSpy = jasmine.createSpyObj("NavigationService", ["navigate"]);
    const formatSpy = jasmine.createSpyObj("FormatUtils", [
      "timeAgo",
      "formatCurrency",
      "getStatusStyles",
    ]);
    formatSpy.formatCurrency.and.callFake((n: number) => `$${n}`);
    formatSpy.timeAgo.and.returnValue("1h ago");

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: OrderDataService, useValue: orderSpy },
        { provide: CaseDataService, useValue: caseSpy },
        { provide: NavigationService, useValue: navSpy },
        { provide: FormatUtils, useValue: formatSpy },
        {
          provide: DashboardDataService,
          useValue: {
            currentDays: signal(volumeDays),
            weekMax: signal(21),
            loading: signal(false),
          },
        },
        {
          provide: NotificationDataService,
          useValue: {
            notifications: signal([
              {
                id: "n1",
                type: "order",
                title: "New Order",
                message: "Order received",
                read: false,
                createdAt: "2024-12-16T10:00:00Z",
              },
            ]),
            loading: signal(false),
            unreadCount: signal(1),
          },
        },
        {
          provide: ChangeRequestDataService,
          useValue: { changeRequests: signal([]), loading: signal(false) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    navigationService = TestBed.inject(
      NavigationService,
    ) as jasmine.SpyObj<NavigationService>;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display page header", () => {
    const header = fixture.debugElement.query(By.css("h1"));
    expect(header.nativeElement.textContent).toContain("Good morning");
  });

  it("should display a New Order button that navigates to createOrder", () => {
    const buttons = fixture.debugElement.queryAll(By.css("button"));
    const newOrder = buttons.find((b) =>
      (b.nativeElement.textContent ?? "").includes("New Order"),
    );
    expect(newOrder).toBeTruthy();
    expect(newOrder!.nativeElement.textContent).toContain("New Order");
    newOrder!.nativeElement.click();
    expect(navigationService.navigate).toHaveBeenCalledWith("createOrder");
  });

  it("should render all action icons (no empty icon slots)", () => {
    for (const name of [
      "plus",
      "chevron-right",
      "chevron-right-lg",
      "arrow-right",
      "activity",
      "alert-triangle-sm",
    ]) {
      expect(component.getIconSvg(name).length).toBeGreaterThan(0);
    }
  });

  it("should display stat cards", () => {
    expect(component.statCards.length).toBe(4);
  });

  it("should navigate to create order when navigateTo is called", () => {
    component.navigateTo("createOrder");
    expect(navigationService.navigate).toHaveBeenCalledWith("createOrder");
  });

  it("should render seven volume bars driven by the dashboard data service", () => {
    expect(component.weeklyData().length).toBe(7);
    const chart = fixture.debugElement.query(
      By.css(
        '[aria-label="Bar chart of orders received versus completed per weekday"]',
      ),
    );
    expect(chart).toBeTruthy();
  });

  it("should configure weekly chart scaling from the nice axis max", () => {
    expect(component.volumeNiceMax()).toBe(25);
    const options = component.weeklyVolumeChartOptions();
    const yScale = options?.scales?.["y"] as {
      max?: number;
      ticks?: { stepSize?: number };
    };
    expect(yScale?.max).toBe(25);
    expect(yScale?.ticks?.stepSize).toBe(6.25);
  });

  it("should derive workflow stages from order data with a fallback", () => {
    expect(component.workflowData().length).toBe(6);
    const max = Math.max(...component.workflowData().map((w) => w.count));
    expect(component.getWorkflowBarWidth(max)).toBe(100);
    expect(component.getWorkflowBarWidth(0)).toBe(0);
  });

  it("should render activity from the notification store", () => {
    expect(component.activity().length).toBe(1);
    expect(component.activity()[0].title).toBe("New Order");
  });

  it("should compute dynamic quick stats", () => {
    const stats = component.quickStats();
    expect(stats.length).toBe(3);
    expect(stats[0].label).toBe("Revenue This Month");
    expect(stats[2].value).toContain("open");
  });
});
