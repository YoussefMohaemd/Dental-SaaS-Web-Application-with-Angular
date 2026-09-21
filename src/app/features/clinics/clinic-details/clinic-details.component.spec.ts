import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ClinicDetailsComponent } from './clinic-details.component';

describe('ClinicDetailsComponent', () => {
  let component: ClinicDetailsComponent;
  let fixture: ComponentFixture<ClinicDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClinicDetailsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(ClinicDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should switch tabs', () => {
    component.setTab('orders');
    expect(component.activeTab()).toBe('orders');
    component.setTab('doctors');
    expect(component.activeTab()).toBe('doctors');
  });
});
