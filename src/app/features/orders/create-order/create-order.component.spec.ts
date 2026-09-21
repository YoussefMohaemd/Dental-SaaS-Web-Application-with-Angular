import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { CreateOrderComponent } from './create-order.component';

describe('CreateOrderComponent', () => {
  let component: CreateOrderComponent;
  let fixture: ComponentFixture<CreateOrderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateOrderComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and start at step 1', () => {
    expect(component).toBeTruthy();
    expect(component.step()).toBe(1);
  });

  it('should block proceeding without patient/doctor/clinic', () => {
    expect(component.canProceed()).toBeFalse();
  });

  it('should toggle services', () => {
    component.toggleService('gfmr');
    expect(component.selectedServices()).toContain('gfmr');
    component.toggleService('gfmr');
    expect(component.selectedServices()).not.toContain('gfmr');
  });

  it('should toggle teeth in general context', () => {
    component.toggleTooth(11);
    expect(component.selectedTeeth()).toContain(11);
  });

  it('should advance when step 1 is complete', () => {
    component.setField('patientId', 'p1');
    component.setField('doctorId', 'd1');
    component.setField('clinicId', 'c1');
    expect(component.canProceed()).toBeTrue();
    component.nextStep();
    expect(component.step()).toBe(2);
  });

  it('should not advance when step 1 is incomplete', () => {
    component.nextStep();
    expect(component.step()).toBe(1);
  });

  it('should block step 2 without a selected service', () => {
    component.setField('patientId', 'p1');
    component.setField('doctorId', 'd1');
    component.setField('clinicId', 'c1');
    component.nextStep();
    expect(component.step()).toBe(2);
    expect(component.canProceed()).toBeFalse();
    component.nextStep();
    expect(component.step()).toBe(2);
  });

  it('should not jump over invalid steps via the stepper', () => {
    component.goToStep(3);
    expect(component.step()).toBe(1);
    component.setField('patientId', 'p1');
    component.setField('doctorId', 'd1');
    component.setField('clinicId', 'c1');
    component.goToStep(2);
    expect(component.step()).toBe(2);
    component.goToStep(4);
    expect(component.step()).toBe(2);
  });

  it('should allow navigating back to completed steps', () => {
    component.setField('patientId', 'p1');
    component.setField('doctorId', 'd1');
    component.setField('clinicId', 'c1');
    component.nextStep();
    component.toggleService('gfmr');
    component.nextStep();
    expect(component.step()).toBe(3);
    component.goToStep(1);
    expect(component.step()).toBe(1);
  });

  it('should seed per-service details and clinical forms on selection', () => {
    component.toggleService('surgical-guide');
    expect(component.getServiceDetail('surgical-guide').implantSystem).toBe('Straumann');
    expect(component.getServiceForm('surgical-guide').marginType).toBe('Chamfer');
    component.setServiceDetail('surgical-guide', 'shade', 'B1');
    expect(component.getServiceDetail('surgical-guide').shade).toBe('B1');
  });

  it('should track per-service tooth assignment', () => {
    component.toggleService('gfmr');
    component.activeServiceForTeeth.set('gfmr');
    component.toggleTooth(11);
    expect(component.teethForService('gfmr')).toContain(11);
    expect(component.allSelectedTeeth()).toContain(11);
  });

  it('should expose the visible chart selection as a reactive computed', () => {
    component.toggleTooth(12);
    expect(component.visibleSelectedTeeth()).toContain(12);
    component.toggleService('gfmr');
    component.activeServiceForTeeth.set('gfmr');
    expect(component.visibleSelectedTeeth()).not.toContain(12);
    component.toggleTooth(11);
    expect(component.visibleSelectedTeeth()).toContain(11);
  });

  it('should combine general and per-service teeth for review', () => {
    component.toggleTooth(12);
    component.toggleService('gfmr');
    component.activeServiceForTeeth.set('gfmr');
    component.toggleTooth(11);
    expect(component.allTeethCombined()).toEqual([11, 12]);
  });
});
