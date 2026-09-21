import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { OrdersComponent } from './orders.component';

describe('OrdersComponent', () => {
  let component: OrdersComponent;
  let fixture: ComponentFixture<OrdersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdersComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(OrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle sorting on the same column', () => {
    component.toggleSort('amount');
    expect(component.sortColumn()).toBe('amount');
    expect(component.sortDirection()).toBe('asc');
    component.toggleSort('amount');
    expect(component.sortDirection()).toBe('desc');
  });

  it('should manage multi-select status filters', () => {
    component.addStatusFilter('New');
    component.addStatusFilter('New');
    expect(component.statusFilter()).toEqual(['New']);
    component.removeFilter('status', 'New');
    expect(component.statusFilter()).toEqual([]);
  });

  it('should toggle row selection', () => {
    component.toggleSelect('ord-1');
    expect(component.isSelected('ord-1')).toBeTrue();
    component.toggleSelect('ord-1');
    expect(component.isSelected('ord-1')).toBeFalse();
  });

  it('should clear all filters and reset pagination', () => {
    component.page.set(3);
    component.clearAllFilters();
    expect(component.page()).toBe(1);
    expect(component.activeFilters()).toEqual([]);
  });
});
