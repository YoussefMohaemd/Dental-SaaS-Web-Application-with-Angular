import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsComponent } from './forms.component';

describe('FormsComponent', () => {
  let component: FormsComponent;
  let fixture: ComponentFixture<FormsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FormsComponent] }).compileComponents();
    fixture = TestBed.createComponent(FormsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle the active section', () => {
    component.setActive('doctor');
    expect(component.active()).toBe('doctor');
    component.setActive('doctor');
    expect(component.active()).toBeNull();
  });

  it('should expose Lucide-equivalent SVG icons for sections', () => {
    for (const section of component.sections) {
      expect(component.getIconSvg(section.icon)).toContain('<svg');
    }
  });

  it('should manage scan files and severity', () => {
    component.removeScanFile('UpperArch_scan_01.stl');
    expect(component.scanFiles()).not.toContain('UpperArch_scan_01.stl');
    component.severity.set('High');
    expect(component.severityClasses('High')).toContain('border-warning');
  });
});
