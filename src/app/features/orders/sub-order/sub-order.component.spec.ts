import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { SubOrderComponent } from './sub-order.component';

describe('SubOrderComponent', () => {
  let component: SubOrderComponent;
  let fixture: ComponentFixture<SubOrderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubOrderComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SubOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to the so-2 sub-order detail (React parity)', () => {
    expect(component.subOrder()?.id).toBe('so-2');
    expect(component.detail().id).toBe('so-2');
  });

  it('should compute progress from required forms and scans', () => {
    // so-2: 2/3 forms complete + 2/3 scans uploaded over 6 required = 67%.
    expect(component.formsComplete()).toBe(2);
    expect(component.scansUploaded()).toBe(2);
    expect(component.progress()).toBe(67);
  });

  it('should render four tabs with forms/scans count badges', () => {
    const tabs = fixture.debugElement.queryAll(By.css('[role="tab"]'));
    const labels = tabs.map(t =>
      (t.nativeElement.textContent as string).replace(/\s+/g, ' ').trim().split(' ')[0],
    );
    expect(labels).toEqual(['overview', 'forms', 'scans', 'activity']);
    const badges = tabs.map(t => (t.nativeElement.textContent as string).replace(/\s+/g, ' ').trim());
    expect(badges[1]).toContain('2/3');
    expect(badges[2]).toContain('2/3');
  });

  it('should switch tabs on click', () => {
    component.setTab('scans');
    fixture.detectChanges();
    expect(component.tab()).toBe('scans');
    const panel = fixture.debugElement.query(By.css('[role="tabpanel"]'));
    expect(panel.nativeElement.textContent).toContain('Bite Scan');
  });

  it('should render the read-only tooth chart on overview when teeth exist', () => {
    component.setTab('overview');
    fixture.detectChanges();
    const chart = fixture.debugElement.query(By.css('app-teeth-chart'));
    expect(chart).toBeTruthy();
  });

  it('should disable Post when the note composer is empty', () => {
    component.setTab('activity');
    component.note.set('');
    fixture.detectChanges();
    const postBtn = fixture.debugElement
      .queryAll(By.css('button'))
      .find(b => b.nativeElement.textContent.trim() === 'Post');
    expect(postBtn?.nativeElement.disabled).toBeTrue();
    component.note.set('Bite scan requested');
    fixture.detectChanges();
    expect(postBtn?.nativeElement.disabled).toBeFalse();
  });

  it('should fall back to the orders list when no parent order resolves', () => {
    // Test bed has no route params and an empty order store, so order() is
    // undefined and goBack() must take the safe fallback (React parity: the
    // back button never dead-ends).
    spyOn(component['navigationService'], 'navigate');
    expect(component.order()).toBeUndefined();
    component.goBack();
    expect(component['navigationService'].navigate).toHaveBeenCalledWith('orders');
  });

  it('should expose empty, loading and error-agnostic rendering (React parity: always detail view)', () => {
    expect(component.orderTag()).toMatch(/^#/);
    expect(component.statusLabel()).toBe('In Progress');
  });
});
