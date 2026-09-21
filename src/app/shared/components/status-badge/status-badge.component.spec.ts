import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  let component: StatusBadgeComponent;
  let fixture: ComponentFixture<StatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadgeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(StatusBadgeComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('status', 'New');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display status text', () => {
    fixture.componentRef.setInput('status', 'Completed');
    fixture.detectChanges();
    const badge = fixture.debugElement.query(By.css('span'));
    expect(badge.nativeElement.textContent.trim()).toBe('Completed');
  });

  it('should apply correct background color for Completed status', () => {
    fixture.componentRef.setInput('status', 'Completed');
    fixture.detectChanges();
    const badge = fixture.debugElement.query(By.css('span'));
    expect(badge.nativeElement.style.backgroundColor).toBe('rgb(236, 253, 245)'); // #ECFDF5
  });

  it('should apply correct text color for Cancelled status', () => {
    fixture.componentRef.setInput('status', 'Cancelled');
    fixture.detectChanges();
    const badge = fixture.debugElement.query(By.css('span'));
    expect(badge.nativeElement.style.color).toBe('rgb(185, 28, 28)'); // #B91C1C
  });

  it('should apply size classes', () => {
    fixture.componentRef.setInput('size', 'md');
    fixture.detectChanges();
    const badge = fixture.debugElement.query(By.css('span'));
    expect(badge.nativeElement).toHaveClass('text-sm');
  });

  it('should handle unknown status with default styles', () => {
    fixture.componentRef.setInput('status', 'Unknown');
    fixture.detectChanges();
    const badge = fixture.debugElement.query(By.css('span'));
    expect(badge.nativeElement.style.backgroundColor).toBe('rgb(241, 245, 249)'); // #F1F5F9
  });
});