import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectComponent } from './select.component';

describe('SelectComponent', () => {
  let fixture: ComponentFixture<SelectComponent>;
  let component: SelectComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('id', 'status-select');
    fixture.componentRef.setInput('options', ['New', 'Review', 'Design']);
    fixture.componentRef.setInput('placeholder', 'Choose status');
    fixture.detectChanges();
  });

  it('renders the placeholder and options', () => {
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    const options = Array.from(select.querySelectorAll('option')).map(option => option.textContent?.trim());

    expect(options).toEqual(['Choose status', 'New', 'Review', 'Design']);
  });

  it('updates the model when the selection changes', () => {
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = 'Review';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(component.value()).toBe('Review');
  });

  it('applies disabled state to the native select', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    expect(select.disabled).toBeTrue();
  });
});