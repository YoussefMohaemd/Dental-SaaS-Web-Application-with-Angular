import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { InputComponent } from './input.component';

describe('InputComponent', () => {
  let component: InputComponent;
  let fixture: ComponentFixture<InputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(InputComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('id', 'test-input');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render label when provided', () => {
    fixture.componentRef.setInput('label', 'Email');
    fixture.detectChanges();
    const label = fixture.debugElement.query(By.css('label'));
    expect(label.nativeElement.textContent.trim()).toBe('Email');
  });

  it('should bind value to input', () => {
    fixture.componentRef.setInput('value', 'test@example.com');
    fixture.detectChanges();
    const input = fixture.debugElement.query(By.css('input'));
    expect(input.nativeElement.value).toBe('test@example.com');
  });

  it('should update value on input', () => {
    const input = fixture.debugElement.query(By.css('input'));
    input.nativeElement.value = 'new value';
    input.triggerEventHandler('input', { target: input.nativeElement });
    expect(component.value()).toBe('new value');
  });

  it('should be disabled when disabled input is true', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const input = fixture.debugElement.query(By.css('input'));
    expect(input.nativeElement.disabled).toBe(true);
  });

  it('should show error message when error is provided', () => {
    fixture.componentRef.setInput('error', 'Invalid email');
    fixture.detectChanges();
    const error = fixture.debugElement.query(By.css('.field-error'));
    expect(error.nativeElement.textContent.trim()).toBe('Invalid email');
  });

  it('should show hint when provided and no error', () => {
    fixture.componentRef.setInput('hint', 'Enter your email');
    fixture.detectChanges();
    const hint = fixture.debugElement.query(By.css('.field-hint'));
    expect(hint.nativeElement.textContent.trim()).toBe('Enter your email');
  });

  it('should not show hint when error is present', () => {
    fixture.componentRef.setInput('hint', 'Enter your email');
    fixture.componentRef.setInput('error', 'Invalid email');
    fixture.detectChanges();
    const hint = fixture.debugElement.query(By.css('.field-hint'));
    expect(hint).toBeFalsy();
  });

  it('should emit blur event', () => {
    spyOn(component.onBlur, 'emit');
    const input = fixture.debugElement.query(By.css('input'));
    input.triggerEventHandler('blur', new FocusEvent('blur'));
    expect(component.onBlur.emit).toHaveBeenCalled();
  });
});