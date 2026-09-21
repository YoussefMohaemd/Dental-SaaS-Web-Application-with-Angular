import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DashboardComponent } from './dashboard.component';
import { OrderDataService } from '../../../core/services/order-data.service';
import { CaseDataService } from '../../../core/services/case-data.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { FormatUtils } from '../../../core/services/format-utils.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let orderService: jasmine.SpyObj<OrderDataService>;
  let caseService: jasmine.SpyObj<CaseDataService>;
  let navigationService: jasmine.SpyObj<NavigationService>;
  let formatUtils: jasmine.SpyObj<FormatUtils>;

  beforeEach(async () => {
    const orderSpy = jasmine.createSpyObj('OrderDataService', [], {
      orders: { asReadonly: () => [] },
      loading: { asReadonly: () => false },
      urgentOrdersCount: { asReadonly: () => 0 },
      completedTodayCount: { asReadonly: () => 0 }
    });
    const caseSpy = jasmine.createSpyObj('CaseDataService', [], {
      cases: { asReadonly: () => [] }
    });
    const navSpy = jasmine.createSpyObj('NavigationService', ['navigate']);
    const formatSpy = jasmine.createSpyObj('FormatUtils', ['timeAgo', 'formatCurrency', 'getStatusStyles']);

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: OrderDataService, useValue: orderSpy },
        { provide: CaseDataService, useValue: caseSpy },
        { provide: NavigationService, useValue: navSpy },
        { provide: FormatUtils, useValue: formatSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    orderService = TestBed.inject(OrderDataService) as jasmine.SpyObj<OrderDataService>;
    caseService = TestBed.inject(CaseDataService) as jasmine.SpyObj<CaseDataService>;
    navigationService = TestBed.inject(NavigationService) as jasmine.SpyObj<NavigationService>;
    formatUtils = TestBed.inject(FormatUtils) as jasmine.SpyObj<FormatUtils>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display page header', () => {
    const header = fixture.debugElement.query(By.css('h1'));
    expect(header.nativeElement.textContent).toContain('Good morning');
  });

  it('should display new order button', () => {
    const button = fixture.debugElement.query(By.css('app-button'));
    expect(button).toBeTruthy();
  });

  it('should display stat cards', () => {
    const statCards = fixture.debugElement.queryAll(By.css('app-button[class*="outline"]'));
    expect(statCards.length).toBe(4);
  });

  it('should navigate to create order when button clicked', () => {
    const button = fixture.debugElement.query(By.css('app-button'));
    button.triggerEventHandler('onClick', new MouseEvent('click'));
    expect(navigationService.navigate).toHaveBeenCalledWith('createOrder', undefined);
  });
});