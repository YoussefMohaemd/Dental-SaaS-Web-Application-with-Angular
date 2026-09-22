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

  it('should synthesize detail records from the summary counts for the exact sub-order id', async () => {
    httpMock.expectOne('/data/sub-orders.json').flush([
      {
        id: 'so-58',
        orderId: 'ord-33',
        service: 'Shade Match',
        icon: 'clipboard',
        status: 'in-progress',
        formsComplete: 1,
        formsTotal: 1,
        scansComplete: 1,
        scansTotal: 1,
        teeth: [45, 46, 47],
        priority: 'High',
        dueDate: '2024-12-27',
        notes: 'Shade A3 verified against clinic photos before glaze.',
      },
    ]);
    await new Promise(resolve => setTimeout(resolve, 250));

    const detail = service.getDetailByContext('ord-33', 'so-58');

    expect(detail?.id).toBe('so-58');
    expect(detail?.forms.length).toBe(1);
    expect(detail?.scans.length).toBe(1);
    expect(detail?.forms[0].label).toBe('Shade Match Form');
    expect(detail?.scans[0].label).toBe('Shade Match Scan');
    expect(service.getDetailByContext('ord-33', 'missing-sub-order')).toBeUndefined();
    expect(service.getDetailByContext('ord-99', 'so-58')).toBeUndefined();
  });
});