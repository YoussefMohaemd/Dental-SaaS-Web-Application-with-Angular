import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ArchBadgeComponent } from './arch-badge.component';

describe('ArchBadgeComponent', () => {
  let component: ArchBadgeComponent;
  let fixture: ComponentFixture<ArchBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchBadgeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ArchBadgeComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('arch', 'Maxilla');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display MX for Maxilla', () => {
    fixture.componentRef.setInput('arch', 'Maxilla');
    fixture.detectChanges();
    const badge = fixture.debugElement.query(By.css('span'));
    expect(badge.nativeElement.textContent.trim()).toBe('MX');
    expect(badge.nativeElement).toHaveClass('bg-blue-50');
    expect(badge.nativeElement).toHaveClass('text-blue-700');
  });

  it('should display MD for Mandible', () => {
    fixture.componentRef.setInput('arch', 'Mandible');
    fixture.detectChanges();
    const badge = fixture.debugElement.query(By.css('span'));
    expect(badge.nativeElement.textContent.trim()).toBe('MD');
    expect(badge.nativeElement).toHaveClass('bg-teal-50');
    expect(badge.nativeElement).toHaveClass('text-teal-700');
  });

  it('should display both MX and MD for Both', () => {
    fixture.componentRef.setInput('arch', 'Both');
    fixture.detectChanges();
    const badges = fixture.debugElement.queryAll(By.css('span'));
    expect(badges.length).toBe(2);
    expect(badges[0].nativeElement.textContent.trim()).toBe('MX');
    expect(badges[1].nativeElement.textContent.trim()).toBe('MD');
  });

  it('should display custom text for unknown arch', () => {
    fixture.componentRef.setInput('arch', 'Custom');
    fixture.detectChanges();
    const badge = fixture.debugElement.query(By.css('span'));
    expect(badge.nativeElement.textContent.trim()).toBe('Custom');
  });
});