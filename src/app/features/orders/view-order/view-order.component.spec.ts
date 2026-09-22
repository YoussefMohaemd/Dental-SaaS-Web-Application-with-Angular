import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ViewOrderComponent } from './view-order.component';

describe('ViewOrderComponent', () => {
  let component: ViewOrderComponent;
  let fixture: ComponentFixture<ViewOrderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewOrderComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ orderId: 'missing-order' })),
          },
        },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ViewOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose seven stages and data-driven sub-orders', () => {
    expect(component.stages.length).toBe(7);
    // Sub-orders come from SubOrderDataService.getByOrderId (same source as
    // the TreeTable) — empty until the async JSON loads, never hardcoded.
    expect(component.subOrders()).toEqual([]);
  });

  it('should format sub-order ids and progress', () => {
    expect(component.formatSubOrderId(0)).toBe('SO-01');
    const progress = component.subOrderProgress({
      id: 'so-x',
      service: 'Test',
      icon: '🦷',
      status: 'completed',
      formsComplete: 3,
      formsTotal: 3,
      scansComplete: 3,
      scansTotal: 3,
      teeth: [],
      priority: 'Normal',
      dueDate: '2024-01-01',
      notes: '',
    } as never);
    expect(progress).toBeGreaterThanOrEqual(0);
    expect(progress).toBeLessThanOrEqual(100);
  });

  it('should toggle the more-actions menu', () => {
    expect(component.moreMenuOpen()).toBeFalse();
    component.openMoreMenu();
    expect(component.moreMenuOpen()).toBeTrue();
    component.closeMoreMenu();
    expect(component.moreMenuOpen()).toBeFalse();
  });

  it('should open and close the note dialog', () => {
    component.openNoteDialog();
    expect(component.noteDialogVisible()).toBeTrue();
    component.closeNoteDialog();
    expect(component.noteDialogVisible()).toBeFalse();
  });

  it('should not save empty notes', () => {
    component.noteText.set('   ');
    component.saveNote();
    expect(component.notes().length).toBe(0);
    expect(component.noteSaving()).toBeFalse();
  });

  it('should ask for delete confirmation', () => {
    component.askDelete();
    expect(component.confirmDeleteVisible()).toBeTrue();
    component.cancelDelete();
    expect(component.confirmDeleteVisible()).toBeFalse();
  });

  it('should expose an explicit not-found state for invalid ids', () => {
    expect(component.order()).toBeUndefined();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Order not found');
  });
});
