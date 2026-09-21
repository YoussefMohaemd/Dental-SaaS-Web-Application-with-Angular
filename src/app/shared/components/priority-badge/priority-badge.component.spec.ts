import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PriorityBadgeComponent } from './priority-badge.component';

describe('PriorityBadgeComponent', () => {
  let component: PriorityBadgeComponent;
  let fixture: ComponentFixture<PriorityBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PriorityBadgeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PriorityBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display priority text', () => {
    fixture.componentRef.setInput('priority', 'High');
    fixture.detectChanges();
    const badge = fixture.debugElement.query(By.css('span:last-child'));
    expect(badge.nativeElement.textContent.trim()).toBe('High');
  });

  it('should apply correct dot class for Urgent priority', () => {
    fixture.componentRef.setInput('priority', 'Urgent');
    fixture.detectChanges();
    const dot = fixture.debugElement.query(By.css('span:first-child'));
    expect(dot.nativeElement).toHaveClass('bg-red-500');
  });

  it('should apply correct text color class for Normal priority', () => {
    fixture.componentRef.setInput('priority', 'Normal');
    fixture.detectChanges();
    const text = fixture.debugElement.query(By.css('span:last-child'));
    expect(text.nativeElement).toHaveClass('text-blue-500');
  });

  it('should apply default styles for unknown priority', () => {
    fixture.componentRef.setInput('priority', 'Unknown');
    fixture.detectChanges();
    const dot = fixture.debugElement.query(By.css('span:first-child'));
    expect(dot.nativeElement).toHaveClass('bg-slate-400');
  });
});