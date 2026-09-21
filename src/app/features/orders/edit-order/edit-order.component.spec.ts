import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { EditOrderComponent } from './edit-order.component';

describe('EditOrderComponent', () => {
  let component: EditOrderComponent;
  let fixture: ComponentFixture<EditOrderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditOrderComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(EditOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should build the edit form with validation', () => {
    expect(component.editForm).toBeTruthy();
    component.editForm.controls.units.setValue(0);
    expect(component.editForm.controls.units.invalid).toBeTrue();
    component.editForm.controls.units.setValue(2);
    expect(component.editForm.controls.units.valid).toBeTrue();
  });

  it('should toggle the order lock', () => {
    const initial = component.isLocked();
    component.toggleLock();
    expect(component.isLocked()).toBe(!initial);
  });

  it('should flag invalid required fields', () => {
    component.editForm.controls.patientId.setValue('');
    component.editForm.controls.patientId.markAsTouched();
    expect(component.fieldInvalid('patientId')).toBeTrue();
  });
});
