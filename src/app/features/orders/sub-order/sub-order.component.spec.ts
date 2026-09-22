import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';
import { SubOrderComponent } from './sub-order.component';

describe('SubOrderComponent', () => {
  let component: SubOrderComponent;
  let fixture: ComponentFixture<SubOrderComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubOrderComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ orderId: 'ord-1', subOrderId: 'so-2' })),
            queryParamMap: of(convertToParamMap({})),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SubOrderComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectOne('/data/orders.json').flush([{
      id: 'ord-1', orderNumber: 'DL-024001', patientId: 'pt1', patientName: 'Alice Johnson',
      doctorId: 'dr1', doctorName: 'Dr. Allison Park', clinicId: 'cl1', clinicName: 'Bright Smile Dental',
      scanCenterId: 'sc1', scanCenterName: 'SC-LA Central', status: 'New', priority: 'Normal',
      restoration: 'Crown', arch: 'Maxilla', format: 'STL', shade: 'A2', units: 1, amount: 450,
      billed: false, billTo: 'Bright Smile Dental', vouchers: 0, isLocked: false, hasNotes: false,
      notes: '', receivedAt: '2024-12-10T10:00:00Z', updatedAt: '2024-12-10T10:00:00Z', dueDate: '2024-12-24',
    }]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should resolve the explicit route sub-order', () => {
    expect(component.subOrder()?.id).toBe('so-2');
    expect(component.detail().id).toBe('so-2');
  });

  it('should compute progress from required forms and scans', () => {
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

  it('should navigate to the resolved parent order', () => {
    spyOn(component['navigationService'], 'navigate');
    expect(component.order()?.id).toBe('ord-1');
    component.goBack();
    expect(component['navigationService'].navigate).toHaveBeenCalledWith('viewOrder', { orderId: 'ord-1' });
  });

  it('should return no detail for an unknown sub-order id', () => {
    expect(component['subOrderService'].getDetailById('missing-sub-order')).toBeUndefined();
  });

  it('should expose empty, loading and error-agnostic rendering (React parity: always detail view)', () => {
    expect(component.orderTag()).toMatch(/^#/);
    expect(component.statusLabel()).toBe('In Progress');
  });
});
