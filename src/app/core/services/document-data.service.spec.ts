import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DocumentDataService } from './document-data.service';
import { LabDocument } from '../models/document.model';

describe('DocumentDataService', () => {
  let service: DocumentDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(DocumentDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load documents from JSON', () => {
    const mock: LabDocument[] = [
      { id: 'd1', name: 'rx_test.pdf', category: 'Prescriptions', type: 'PDF', size: '10 KB', date: '2024-12-15', doctor: 'Dr. Test' }
    ];
    httpMock.expectOne('/data/documents.json').flush(mock);
    expect(service.documents().length).toBe(1);
    expect(service.getDocumentById('d1')?.name).toBe('rx_test.pdf');
  });

  it('should surface an error when the request fails', () => {
    httpMock.expectOne('/data/documents.json').error(new ProgressEvent('error'));
    expect(service.error()).not.toBeNull();
    expect(service.documents().length).toBe(0);
  });
});
