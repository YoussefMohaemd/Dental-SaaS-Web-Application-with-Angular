import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TableModule } from "primeng/table";
import { AppButtonComponent } from "@shared/components/button/button.component";
import { EntityDialogComponent } from "@shared/components/entity-dialog/entity-dialog.component";
import { AppTextFieldComponent } from "@shared/components/input/input.component";
import { TableFeedbackComponent } from "@shared/components/table-feedback/table-feedback.component";
import { IconActionButtonComponent } from "@shared/components/icon-action-button/icon-action-button.component";
import { EnterprisePaginatorComponent } from "@shared/components/enterprise-paginator/enterprise-paginator.component";
import { DocumentDataService } from "@core/services/document-data.service";
import {
  DOCUMENT_CATEGORIES,
  DocumentCategory,
  LabDocument,
} from "@core/interfaces";
import { SafeHtmlPipe } from "@shared/pipes/safe-html.pipe";
import { DisplayDatePipe } from "@shared/pipes/display-date.pipe";

export type { DocumentCategory, LabDocument };

@Component({
  selector: "app-documents",
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    AppButtonComponent,
    EntityDialogComponent,
    AppTextFieldComponent,
    TableFeedbackComponent,
    IconActionButtonComponent,
    EnterprisePaginatorComponent,
    SafeHtmlPipe,
    DisplayDatePipe,
  ],
  templateUrl: "./documents.component.html",
  styleUrl: "./documents.component.scss",
})
export class DocumentsComponent implements OnInit {
  private readonly documentService = inject(DocumentDataService);

  readonly documents = this.documentService.documents;
  readonly loading = this.documentService.loading;
  readonly error = this.documentService.error;
  readonly search = signal("");
  readonly category = signal<"All" | DocumentCategory>("All");
  readonly dragOver = signal(false);
  readonly preview = signal<LabDocument | null>(null);
  readonly previewVisible = signal(false);
  readonly page = signal(1);
  readonly pageSize = 20;

  readonly categories = DOCUMENT_CATEGORIES;

  ngOnInit(): void {
    this.documentService.loadDocuments();
  }

  readonly filtered = computed(() => {
    const query = this.search().trim().toLowerCase();
    const all = this.documents();
    return all.filter((doc) => {
      const matchesCategory =
        this.category() === "All" || doc.category === this.category();
      const matchesQuery =
        !query ||
        doc.name.toLowerCase().includes(query) ||
        doc.doctor.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  });

  readonly pageData = computed(() =>
    this.filtered().slice(
      (this.page() - 1) * this.pageSize,
      this.page() * this.pageSize,
    ),
  );

  onSearchChange(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    this.page.set(1);
  }

  onSearchValueChange(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  setCategory(next: "All" | DocumentCategory): void {
    this.category.set(next);
    this.page.set(1);
  }

  onPageNumberChange(pageNumber: number): void {
    this.page.set(pageNumber);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    const dropped = event.dataTransfer?.files;
    if (dropped) this.addFiles(dropped);
  }

  onBrowse(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) this.addFiles(input.files);
    input.value = "";
  }

  deleteDocument(documentId: string): void {
    this.documentService.deleteDocument(documentId).subscribe({
      error: (error) => console.error("Error deleting document:", error),
    });
  }

  downloadDocument(doc: LabDocument): void {
    const content = `Document: ${doc.name}\nCategory: ${doc.category}\nType: ${doc.type}\nSize: ${doc.size}\nDoctor: ${doc.doctor}\nDate: ${doc.date}\n`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = doc.name + ".txt";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  openPreview(document: LabDocument): void {
    this.preview.set(document);
    this.previewVisible.set(true);
  }

  closePreview(): void {
    this.previewVisible.set(false);
    this.preview.set(null);
  }

  onPreviewVisibleChange(next: boolean): void {
    this.previewVisible.set(next);
    if (!next) this.preview.set(null);
  }

  typeIconSvg(documentType: string): string {
    if (["JPG", "PNG"].includes(documentType)) {
      return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
    }
    if (documentType === "PDF") {
      return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>';
    }
    if (["STL", "PLY", "OBJ"].includes(documentType)) {
      return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
    }
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
  }

  typeIconLargeSvg(documentType: string): string {
    return this.typeIconSvg(documentType).replace(
      'width="18" height="18"',
      'width="48" height="48"',
    );
  }

  emptyIconSvg(): string {
    return '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
  }

  uploadIconSvg(): string {
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>';
  }

  searchIconSvg(): string {
    return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>';
  }

  typeIcon(documentType: string): string {
    return this.typeIconSvg(documentType);
  }

  previewActionIconSvg(): string {
    return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>';
  }

  downloadActionIconSvg(): string {
    return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>';
  }

  deleteActionIconSvg(): string {
    return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>';
  }

  private addFiles(fileList: FileList): void {
    Array.from(fileList)
      .slice(0, 10)
      .forEach((file) => {
        this.documentService
          .createDocument({
            name: file.name,
            category: "Scan Files",
            type: (file.name.split(".").pop() ?? "FILE").toUpperCase(),
            sizeBytes: file.size,
          })
          .subscribe({
            error: (error) => console.error("Error creating document:", error),
          });
      });
  }

}
