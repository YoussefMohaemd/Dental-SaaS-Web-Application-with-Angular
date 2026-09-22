import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { DoctorDetailsComponent } from './doctor-details.component';
import { DoctorDataService } from '@core/services/doctor-data.service';
import { OrderDataService } from '@core/services/order-data.service';

describe('DoctorDetailsComponent', () => {
  let component: DoctorDetailsComponent;
  let fixture: ComponentFixture<DoctorDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorDetailsComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ doctorId: 'missing-doctor' }),
            },
          },
        },
        {
          provide: DoctorDataService,
          useValue: { getDoctorById: () => undefined },
        },
        {
          provide: OrderDataService,
          useValue: { getOrdersByDoctor: () => [] },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DoctorDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render the not-found state for an invalid doctor id', () => {
    expect(component.doctor()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Doctor not found');
  });
});