import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SubOrderDataService } from './sub-order-data.service';

describe('SubOrderDataService', () => {
  let service: SubOrderDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SubOrderDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should preserve service, teeth, and file-reference boundaries when creating sub-orders', () => {
    httpMock.expectOne('/data/sub-orders.json').flush([]);

    const created = service.createForOrder('ord-42', [
      {
        serviceId: 'gfmr',
        service: 'GFMR',
        icon: '⚙️',
        priority: 'High',
        dueDate: '2024-12-24',
        notes: 'Preserve contract',
        teeth: [11, 12],
        scanRequirements: ['Upper scan'],
        creationData: {
          serviceId: 'gfmr',
          serviceDetails: { shade: 'A2' },
          serviceForm: { clinicalNotes: 'Needs review' },
          selectedTeeth: [11, 12],
          scanRequirements: ['Upper scan'],
          fileReferences: ['upper-scan.stl'],
        },
      },
    ]);

    expect(created.length).toBe(1);
    expect(created[0].orderId).toBe('ord-42');
    expect(created[0].creationData?.selectedTeeth).toEqual([11, 12]);
    expect(created[0].creationData?.fileReferences).toEqual(['upper-scan.stl']);
    expect(service.getByOrderId('ord-42').length).toBe(1);
    expect(service.getDetailById(created[0].id)?.forms.length).toBe(1);
  });
});