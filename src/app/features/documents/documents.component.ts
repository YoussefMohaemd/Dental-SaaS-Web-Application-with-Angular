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
  { id: 'd1', name: 'rx_crown_14.pdf', category: 'Prescriptions', type: 'PDF', size: '380 KB', date: '2024-03-03', doctor: 'Dr. Smith' },
  { id: 'd2', name: 'upper_arch_scan.stl', category: 'Scan Files', type: 'STL', size: '4.2 MB', date: '2024-03-01', doctor: 'Dr. Smith' },
  { id: 'd3', name: 'lower_arch_scan.stl', category: 'Scan Files', type: 'STL', size: '3.8 MB', date: '2024-03-01', doctor: 'Dr. Lee' },
  { id: 'd4', name: 'bite_registration.ply', category: 'Scan Files', type: 'PLY', size: '1.2 MB', date: '2024-03-02', doctor: 'Dr. Lee' },
  { id: 'd5', name: 'patient_photo_front.jpg', category: 'Patient Photos', type: 'JPG', size: '2.8 MB', date: '2024-03-02', doctor: 'Dr. Patel' },
  { id: 'd6', name: 'patient_photo_smile.jpg', category: 'Patient Photos', type: 'JPG', size: '2.4 MB', date: '2024-03-02', doctor: 'Dr. Patel' },
  { id: 'd7', name: 'invoice_DL-240101.pdf', category: 'Invoices', type: 'PDF', size: '120 KB', date: '2024-03-05', doctor: 'Dr. Smith' },
  { id: 'd8', name: 'full_arch_backup.zip', category: 'Scan Files', type: 'ZIP', size: '18.6 MB', date: '2024-03-04', doctor: 'Dr. Garcia' },
  { id: 'd9', name: 'monthly_lab_report.pdf', category: 'Reports', type: 'PDF', size: '640 KB', date: '2024-03-06', doctor: 'Lab Admin' },
  { id: 'd10', name: 'shade_reference.jpg', category: 'Patient Photos', type: 'JPG', size: '1.6 MB', date: '2024-03-03', doctor: 'Dr. Garcia' }
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

  openPreview(document: LabDocument): void {
    this.preview.set(document);
    this.previewVisible.set(true);
  }

  closePreview(): void {
    this.previewVisible.set(false);
    this.preview.set(null);
  }

  typeIcon(documentType: string): string {
    if (['JPG', 'PNG'].includes(documentType)) return '🖼️';
    if (documentType === 'PDF') return '📄';
    if (documentType === 'ZIP') return '🗜️';
    return '🦷';
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
