import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { DocumentDataService } from "./document-data.service";
import { LabDocument } from "../interfaces";
import { ApiEndpoint } from "@core/enum/api.endpoint";

describe("DocumentDataService", () => {
  let service: DocumentDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DocumentDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should load documents from the API", () => {
    const mock: LabDocument[] = [
      {
        id: "d1",
        name: "rx_test.pdf",
        category: "Prescriptions",
        type: "PDF",
        size: "10 KB",
        date: "2024-12-15",
        doctor: "Dr. Test",
      },
    ];
    service.loadDocuments();
    httpMock
      .expectOne(ApiEndpoint.DOCUMENTS)
      .flush({ data: mock });
    expect(service.documents().length).toBe(1);
    expect(service.getDocumentById("d1")?.name).toBe("rx_test.pdf");
  });

  it("should surface an error when the request fails", () => {
    service.loadDocuments();
    httpMock
      .expectOne(ApiEndpoint.DOCUMENTS)
      .error(new ProgressEvent("error"));
    expect(service.error()).not.toBeNull();
    expect(service.documents().length).toBe(0);
  });
});
