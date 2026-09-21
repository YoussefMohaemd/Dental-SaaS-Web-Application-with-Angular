import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ErrorStateComponent } from './error-state.component';

describe('ErrorStateComponent', () => {
  let component: ErrorStateComponent;
  let fixture: ComponentFixture<ErrorStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorStateComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display default title and description', () => {
    const title = fixture.debugElement.query(By.css('h3'));
    const desc = fixture.debugElement.query(By.css('p.text-sm'));
    expect(title.nativeElement.textContent.trim()).toBe('Failed to load data');
    expect(desc.nativeElement.textContent.trim()).toBe('An error occurred while loading the data.');
  });

  it('should display custom title and description', () => {
    fixture.componentRef.setInput('title', 'Connection Error');
    fixture.componentRef.setInput('description', 'Unable to connect to server');
    fixture.detectChanges();
    const title = fixture.debugElement.query(By.css('h3'));
    const desc = fixture.debugElement.query(By.css('p.text-sm'));
    expect(title.nativeElement.textContent.trim()).toBe('Connection Error');
    expect(desc.nativeElement.textContent.trim()).toBe('Unable to connect to server');
  });

  it('should display retry button when retryLabel is provided', () => {
    fixture.componentRef.setInput('retryLabel', 'Retry');
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css('app-button'));
    expect(button).toBeTruthy();
  });

  it('should not display retry button when retryLabel is empty', () => {
    fixture.componentRef.setInput('retryLabel', '');
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css('app-button'));
    expect(button).toBeFalsy();
  });

  it('should emit retryClick when button clicked', () => {
    spyOn(component.retryClick, 'emit');
    fixture.componentRef.setInput('retryLabel', 'Retry');
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css('app-button'));
    button.triggerEventHandler('onClick', new MouseEvent('click'));
    expect(component.retryClick.emit).toHaveBeenCalled();
  });

  it('should apply custom height', () => {
    fixture.componentRef.setInput('height', '300px');
    fixture.detectChanges();
    const container = fixture.debugElement.query(By.css('div.flex'));
    expect(container.nativeElement.style.height).toBe('300px');
  });
});