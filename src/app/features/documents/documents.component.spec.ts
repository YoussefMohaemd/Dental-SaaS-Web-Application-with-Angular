import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocumentsComponent } from './documents.component';

describe('DocumentsComponent', () => {
  let component: DocumentsComponent;
  let fixture: ComponentFixture<DocumentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DocumentsComponent] }).compileComponents();
    fixture = TestBed.createComponent(DocumentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with ten seeded documents', () => {
    expect(component).toBeTruthy();
    expect(component.documents().length).toBe(10);
  });

  it('should filter by category and search', () => {
    component.setCategory('Invoices');
    expect(component.filtered().every(d => d.category === 'Invoices')).toBeTrue();
    component.setCategory('All');
    component.onSearchChange({ target: { value: 'stl' } } as unknown as Event);
    expect(component.filtered().length).toBeGreaterThan(0);
  });

  it('should delete and preview documents', () => {
    component.deleteDocument('d1');
    expect(component.documents().find(d => d.id === 'd1')).toBeUndefined();
    component.openPreview(component.documents()[0]);
    expect(component.previewVisible()).toBeTrue();
    component.closePreview();
    expect(component.previewVisible()).toBeFalse();
  });
});
