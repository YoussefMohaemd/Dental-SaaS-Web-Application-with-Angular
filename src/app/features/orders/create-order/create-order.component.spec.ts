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
});
