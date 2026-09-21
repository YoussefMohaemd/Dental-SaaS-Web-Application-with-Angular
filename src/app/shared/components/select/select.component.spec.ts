import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SelectComponent } from './select.component';

describe('SelectComponent', () => {
  let component: SelectComponent;
  let fixture: ComponentFixture<SelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SelectComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('id', 'test-select');
    fixture.componentRef.setInput('options', [
      { value: '1', label: 'Option 1' },
      { value: '2', label: 'Option 2' }
    ]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render label when provided', () => {
    fixture.componentRef.setInput('label', 'Status');
    fixture.detectChanges();
    const label = fixture.debugElement.query(By.css('label'));
    expect(label.nativeElement.textContent.trim()).toBe('Status');
  });

  it('should render options', () => {
    const options = fixture.debugElement.queryAll(By.css('option'));
    expect(options.length).toBe(3); // placeholder + 2 options
    expect(options[1].nativeElement.textContent.trim()).toBe('Option 1');
    expect(options[2].nativeElement.textContent.trim()).toBe('Option 2');
  });

  it('should bind value to select', () => {
    fixture.componentRef.setInput('value', '1');
    fixture.detectChanges();
    const select = fixture.debugElement.query(By.css('select'));
    expect(select.nativeElement.value).toBe('1');
  });

  it('should update value on change', () => {
    const select = fixture.debugElement.query(By.css('select'));
    select.nativeElement.value = '2';
    select.triggerEventHandler('change', { target: select.nativeElement });
    expect(component.value()).toBe('2');
  });

  it('should emit change event', () => {
    spyOn(component.onChange, 'emit');
    const select = fixture.debugElement.query(By.css('select'));
    select.nativeElement.value = '2';
    select.triggerEventHandler('change', { target: select.nativeElement });
    expect(component.onChange.emit).toHaveBeenCalledWith('2');
  });

  it('should be disabled when disabled input is true', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const select = fixture.debugElement.query(By.css('select'));
    expect(select.nativeElement.disabled).toBe(true);
  });

  it('should show placeholder option when provided', () => {
    fixture.componentRef.setInput('placeholder', 'Select an option');
    fixture.detectChanges();
    const placeholder = fixture.debugElement.query(By.css('option[value=""]'));
    expect(placeholder.nativeElement.textContent.trim()).toBe('Select an option');
    expect(placeholder.nativeElement.disabled).toBe(true);
  });
});