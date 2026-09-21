import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ViewOrderComponent } from './view-order.component';

describe('ViewOrderComponent', () => {
  let component: ViewOrderComponent;
  let fixture: ComponentFixture<ViewOrderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewOrderComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(ViewOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose seven stages and four sub-orders', () => {
    expect(component.stages.length).toBe(7);
    expect(component.subOrders.length).toBe(4);
  });

  it('should format sub-order ids and progress', () => {
    expect(component.formatSubOrderId(0)).toBe('SO-01');
    const progress = component.subOrderProgress(component.subOrders[0]);
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
});
