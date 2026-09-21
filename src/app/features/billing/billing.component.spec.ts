import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { BillingComponent } from './billing.component';

describe('BillingComponent', () => {
  let component: BillingComponent;
  let fixture: ComponentFixture<BillingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillingComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(BillingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle sort direction on the same column', () => {
    component.toggleSort('amount');
    expect(component.sortColumn()).toBe('amount');
    const direction = component.sortDirection();
    component.toggleSort('amount');
    expect(component.sortDirection()).toBe(direction === 'asc' ? 'desc' : 'asc');
  });

  it('should reset to page 1 when filters change', () => {
    component.page.set(3);
    component.onStatusChange({ target: { value: 'Paid' } } as unknown as Event);
    expect(component.page()).toBe(1);
    expect(component.statusFilter()).toBe('Paid');
  });
});
