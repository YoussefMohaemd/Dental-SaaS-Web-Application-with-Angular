import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TeethChartComponent } from './teeth-chart.component';

describe('TeethChartComponent', () => {
  let component: TeethChartComponent;
  let fixture: ComponentFixture<TeethChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeethChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TeethChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render 32 teeth (16 upper + 16 lower)', () => {
    const teeth = fixture.debugElement.queryAll(By.css('[aria-label^="Tooth "]'));
    expect(teeth.length).toBe(32);
  });

  it('should emit toothToggle when a tooth is clicked', () => {
    spyOn(component.toothToggle, 'emit');
    const first = fixture.debugElement.queryAll(By.css('[aria-label^="Tooth "]'))[0];
    first.triggerEventHandler('click', new MouseEvent('click'));
    expect(component.toothToggle.emit).toHaveBeenCalledWith(18);
  });

  it('should not emit in readOnly mode', () => {
    fixture.componentRef.setInput('readOnly', true);
    fixture.detectChanges();
    spyOn(component.toothToggle, 'emit');
    const first = fixture.debugElement.queryAll(By.css('[aria-label^="Tooth "]'))[0];
    first.triggerEventHandler('click', new MouseEvent('click'));
    expect(component.toothToggle.emit).not.toHaveBeenCalled();
  });

  it('should mark selected teeth with aria-checked', () => {
    fixture.componentRef.setInput('selected', [11, 36]);
    fixture.detectChanges();
    const checked = fixture.debugElement.queryAll(
      By.css('[aria-checked="true"]'),
    );
    expect(checked.length).toBe(2);
  });

  it('should switch jaw filter', () => {
    component.setJaw('upper');
    fixture.detectChanges();
    expect(component.activeJaw()).toBe('upper');
    const lowerLabel = fixture.debugElement.queryAll(
      By.css('span'),
    ).filter(d => d.nativeElement.textContent.trim() === 'Lower Jaw');
    expect(lowerLabel.length).toBe(0);
  });

  it('should map service colors by service index (React parity)', () => {
    fixture.componentRef.setInput('services', ['GFMR', 'Surgical Guide']);
    fixture.componentRef.setInput('serviceTeeth', { GFMR: [11], 'Surgical Guide': [14] });
    fixture.detectChanges();
    expect(component.serviceColors()[11]).toBe('#2563EB');
    expect(component.serviceColors()[14]).toBe('#06B6D4');
  });

  it('should vary tooth width by anatomy (molars widest)', () => {
    expect(component.getToothWidth(18)).toBe(24);
    expect(component.getToothWidth(13)).toBe(14);
  });

  it('should not track hover in readOnly mode', () => {
    fixture.componentRef.setInput('readOnly', true);
    fixture.detectChanges();
    component.onHover(11);
    expect(component.hoveredTooth()).toBeNull();
  });

  it('should activate teeth via space key and prevent page scroll', () => {
    spyOn(component.toothToggle, 'emit');
    const event = new KeyboardEvent('keydown');
    spyOn(event, 'preventDefault');
    component.onSpaceKey(event, 11);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.toothToggle.emit).toHaveBeenCalledWith(11);
  });

  it('should expose typed jaw options', () => {
    expect(component.jaws).toEqual(['both', 'upper', 'lower']);
    component.setJaw('lower');
    expect(component.activeJaw()).toBe('lower');
  });
});
