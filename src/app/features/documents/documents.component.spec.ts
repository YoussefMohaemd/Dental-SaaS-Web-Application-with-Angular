import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { DocumentsComponent } from "./documents.component";
import { LabDocument } from "@core/models/document.model";

const MOCK_DOCS: LabDocument[] = [
  {
    id: "d1",
    name: "rx_alice_johnson_dec2024.pdf",
    category: "Prescriptions",
    type: "PDF",
    size: "380 KB",
    date: "2024-12-15",
    doctor: "Dr. Allison Park",
  },
  {
    id: "d2",
    name: "upper_arch_scan_bc.stl",
    category: "Scan Files",
    type: "STL",
    size: "4.2 MB",
    date: "2024-12-14",
    doctor: "Dr. Marcus Webb",
  },
  {
    id: "d4",
    name: "invoice_INV-010012.pdf",
    category: "Invoices",
    type: "PDF",
    size: "142 KB",
    date: "2024-12-12",
    doctor: "–",
  },
];

describe("DocumentsComponent", () => {
  let component: DocumentsComponent;
  let fixture: ComponentFixture<DocumentsComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DocumentsComponent);
    component = fixture.componentInstance;
    httpMock.expectOne("/data/documents.json").flush(MOCK_DOCS);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should create with documents loaded from the data service", () => {
    expect(component).toBeTruthy();
    expect(component.documents().length).toBe(3);
    expect(component.filtered().length).toBe(3);
  });

  it("should filter by category and search", () => {
    component.setCategory("Invoices");
    expect(
      component.filtered().every((d) => d.category === "Invoices"),
    ).toBeTrue();
    component.setCategory("All");
    component.onSearchChange({ target: { value: "stl" } } as unknown as Event);
    expect(component.filtered().length).toBeGreaterThan(0);
  });

  it("should delete and preview documents", () => {
    component.deleteDocument("d1");
    expect(component.filtered().find((d) => d.id === "d1")).toBeUndefined();
    component.openPreview(component.filtered()[0]);
    expect(component.previewVisible()).toBeTrue();
    component.closePreview();
    expect(component.previewVisible()).toBeFalse();
  });
});
