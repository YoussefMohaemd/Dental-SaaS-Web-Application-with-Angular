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

  it('should compute form progress', () => {
    const form = component.forms()[0];
    expect(component.formProgress(form)).toBe(100);
  });

  it('should filter by category', () => {
    component.setCategory('Consent');
    expect(component.filtered().every(f => f.category === 'Consent')).toBeTrue();
  });
});
