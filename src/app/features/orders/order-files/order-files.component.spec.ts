import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { OrderFilesComponent } from './order-files.component';

describe('OrderFilesComponent', () => {
  let component: OrderFilesComponent;
  let fixture: ComponentFixture<OrderFilesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderFilesComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(OrderFilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with six seeded files', () => {
    expect(component).toBeTruthy();
    expect(component.files().length).toBe(6);
  });

  it('should partition uploaded files', () => {
    expect(component.uploadedFiles().length).toBe(6);
    expect(component.uploadingFiles().length).toBe(0);
  });

  it('should delete a file', () => {
    component.deleteFile('f1');
    expect(component.files().find(f => f.id === 'f1')).toBeUndefined();
  });

  it('should open and close the PrimeNG preview dialog', () => {
    component.openPreview(component.files()[0]);
    expect(component.previewVisible()).toBeTrue();
    component.closePreview();
    expect(component.previewVisible()).toBeFalse();
  });
});
