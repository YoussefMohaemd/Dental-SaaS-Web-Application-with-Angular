import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonComponent } from '@shared/components/button/button.component';

export type DocumentCategory = 'Prescriptions' | 'Scan Files' | 'Patient Photos' | 'Invoices' | 'Reports';

export interface LabDocument {
  id: string;
  name: string;
  category: DocumentCategory;
  type: string;
  size: string;
  date: string;
  doctor: string;
}

const SEED_DOCUMENTS: LabDocument[] = [
  { id: 'd1', name: 'rx_alice_johnson_dec2024.pdf', category: 'Prescriptions', type: 'PDF', size: '380 KB', date: '2024-12-15', doctor: 'Dr. Allison Park' },
  { id: 'd2', name: 'upper_arch_scan_bc.stl', category: 'Scan Files', type: 'STL', size: '4.2 MB', date: '2024-12-14', doctor: 'Dr. Marcus Webb' },
  { id: 'd3', name: 'patient_photos_cr_dec.zip', category: 'Patient Photos', type: 'ZIP', size: '14.2 MB', date: '2024-12-13', doctor: 'Dr. Sophia Lin' },
  { id: 'd4', name: 'invoice_INV-010012.pdf', category: 'Invoices', type: 'PDF', size: '142 KB', date: '2024-12-12', doctor: '–' },
  { id: 'd5', name: 'monthly_report_nov2024.pdf', category: 'Reports', type: 'PDF', size: '1.1 MB', date: '2024-12-01', doctor: 'Lab Manager' },
  { id: 'd6', name: 'bite_registration_eng.stl', category: 'Scan Files', type: 'STL', size: '1.3 MB', date: '2024-12-10', doctor: 'Dr. Robert Chen' },
  { id: 'd7', name: 'shade_guide_ref_final.jpg', category: 'Patient Photos', type: 'JPG', size: '2.4 MB', date: '2024-12-09', doctor: 'Dr. Jennifer Walsh' },
  { id: 'd8', name: 'rx_david_nguyen.pdf', category: 'Prescriptions', type: 'PDF', size: '290 KB', date: '2024-12-08', doctor: 'Dr. Robert Chen' },
  { id: 'd9', name: 'case_summary_cs8102.pdf', category: 'Reports', type: 'PDF', size: '890 KB', date: '2024-12-05', doctor: 'Lab Manager' },
  { id: 'd10', name: 'full_arch_scan_ef.ply', category: 'Scan Files', type: 'PLY', size: '8.6 MB', date: '2024-12-04', doctor: 'Dr. Jennifer Walsh' }
];

const CATEGORIES: ('All' | DocumentCategory)[] = ['All', 'Prescriptions', 'Scan Files', 'Patient Photos', 'Invoices', 'Reports'];

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, TableModule, DialogModule, ButtonComponent],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.scss'
})
export class DocumentsComponent {
  readonly documents = signal<LabDocument[]>(SEED_DOCUMENTS);
  readonly search = signal('');
  readonly category = signal<'All' | DocumentCategory>('All');
  readonly dragOver = signal(false);
  readonly preview = signal<LabDocument | null>(null);
  readonly previewVisible = signal(false);

  readonly categories = CATEGORIES;

  readonly filtered = computed(() => {
    const query = this.search().trim().toLowerCase();
    return this.documents().filter(doc => {
      const matchesCategory = this.category() === 'All' || doc.category === this.category();
      const matchesQuery =
        !query || doc.name.toLowerCase().includes(query) || doc.doctor.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  });

  onSearchChange(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  setCategory(next: 'All' | DocumentCategory): void {
    this.category.set(next);
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
    input.value = '';
  }

  deleteDocument(documentId: string): void {
    this.documents.update(current => current.filter(d => d.id !== documentId));
  }

  downloadDocument(doc: LabDocument): void {
    const content = `Document: ${doc.name}\nCategory: ${doc.category}\nType: ${doc.type}\nSize: ${doc.size}\nDoctor: ${doc.doctor}\nDate: ${doc.date}\n`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = doc.name + '.txt';
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

  typeIconSvg(documentType: string): string {
    if (['JPG', 'PNG'].includes(documentType)) {
      return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
    }
    if (documentType === 'PDF') {
      return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>';
    }
    if (['STL', 'PLY', 'OBJ'].includes(documentType)) {
      return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
    }
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
  }

  typeIconLargeSvg(documentType: string): string {
    return this.typeIconSvg(documentType).replace('width="18" height="18"', 'width="48" height="48"');
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

  private addFiles(fileList: FileList): void {
    const additions: LabDocument[] = Array.from(fileList).slice(0, 10).map((file, index) => ({
      id: `upload-${Date.now()}-${index}`,
      name: file.name,
      category: 'Scan Files' as DocumentCategory,
      type: (file.name.split('.').pop() ?? 'FILE').toUpperCase(),
      size: this.formatBytes(file.size),
      date: new Date().toISOString().slice(0, 10),
      doctor: 'You'
    }));
    if (additions.length > 0) this.documents.update(current => [...additions, ...current]);
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
