import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OrderDataService } from './order-data.service';

describe('OrderDataService', () => {
  let service: OrderDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OrderDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should preserve the create-order payload boundary', () => {
    httpMock.expectOne('/data/orders.json').flush([]);
    const created = service.createOrder({
      patientId: 'pt-1',
      patientName: 'Alice Johnson',
      doctorId: 'dr-1',
      doctorName: 'Dr. Park',
      clinicId: 'cl-1',
      clinicName: 'Bright Smile Dental',
      scanCenterId: 'scan-1',
      scanCenterName: 'Main Scan Center',
      status: 'New',
      priority: 'High',
      restoration: 'Crown',
      arch: 'Maxilla',
      format: 'STL',
      shade: 'A2',
      units: 2,
      amount: 500,
      billed: false,
      billTo: 'Bright Smile Dental',
      vouchers: 0,
      isLocked: false,
      hasNotes: true,
      notes: 'Create-order contract test',
      dueDate: '2024-12-24',
      creationData: {
        services: [
          {
            serviceId: 'gfmr',
            serviceDetails: { shade: 'A2', arch: 'Both' },
            serviceForm: { clinicalNotes: 'Needs review' },
            selectedTeeth: [11, 12],
            scanRequirements: ['Upper arch scan'],
            fileReferences: ['scan-1.stl'],
          },
        ],
      },
    });

    expect(created.creationData?.services[0].serviceId).toBe('gfmr');
    expect(created.creationData?.services[0].selectedTeeth).toEqual([11, 12]);
    expect(created.creationData?.services[0].fileReferences).toEqual(['scan-1.stl']);
    expect(service.totalOrders()).toBe(1);
  });
});