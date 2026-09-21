import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { OrderDataService } from '@core/services/order-data.service';
import { NavigationService } from '@core/services/navigation.service';
import { ButtonComponent } from '@shared/components/button/button.component';

export type FileStatus = 'uploaded' | 'uploading' | 'failed';

export interface OrderFileEntry {
  id: string;
  name: string;
  type: string;
  size: string;
  sizeBytes: number;
  status: FileStatus;
  progress: number;
  uploadedAt: string;
  uploadedBy: string;
}

const INITIAL_FILES: OrderFileEntry[] = [
  { id: 'f1', name: 'upper_arch_scan.stl', type: 'STL', size: '4.2 MB', sizeBytes: 4404019, status: 'uploaded', progress: 100, uploadedAt: '2024-03-01', uploadedBy: 'Dr. Smith' },
  { id: 'f2', name: 'lower_arch_scan.stl', type: 'STL', size: '3.8 MB', sizeBytes: 3984589, status: 'uploaded', progress: 100, uploadedAt: '2024-03-01', uploadedBy: 'Dr. Smith' },
  { id: 'f3', name: 'bite_registration.stl', type: 'STL', size: '1.2 MB', sizeBytes: 1258291, status: 'uploaded', progress: 100, uploadedAt: '2024-03-02', uploadedBy: 'Lab Tech' },
  { id: 'f4', name: 'patient_photo_front.jpg', type: 'JPG', size: '2.8 MB', sizeBytes: 2936012, status: 'uploaded', progress: 100, uploadedAt: '2024-03-02', uploadedBy: 'Clinic' },
  { id: 'f5', name: 'shade_guide_reference.jpg', type: 'JPG', size: '1.6 MB', sizeBytes: 1677721, status: 'uploaded', progress: 100, uploadedAt: '2024-03-03', uploadedBy: 'Clinic' },
  { id: 'f6', name: 'rx_prescription.pdf', type: 'PDF', size: '380 KB', sizeBytes: 389120, status: 'uploaded', progress: 100, uploadedAt: '2024-03-03', uploadedBy: 'Dr. Smith' }
];

const ACCEPTED_TYPES = ['STL', 'PLY', 'OBJ', 'JPG', 'PNG', 'PDF', 'DCM'];

@Component({
  selector: 'app-order-files',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonComponent],
  templateUrl: './order-files.component.html',
  styleUrl: './order-files.component.scss'
})
export class OrderFilesComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderDataService);
  protected readonly navigationService = inject(NavigationService);

  readonly files = signal<OrderFileEntry[]>(INITIAL_FILES);
  readonly dragOver = signal(false);
  readonly previewFile = signal<OrderFileEntry | null>(null);
  readonly previewVisible = signal(false);

  readonly order = computed(() => {
    const orderId = this.route.snapshot.paramMap.get('orderId');
    return this.orderService.getOrderById(orderId ?? '') ?? this.orderService.orders()[0];
  });

  readonly uploadedFiles = computed(() => this.files().filter(f => f.status === 'uploaded'));
  readonly uploadingFiles = computed(() => this.files().filter(f => f.status === 'uploading'));
  readonly failedFiles = computed(() => this.files().filter(f => f.status === 'failed'));

  goBack(): void {
    const current = this.order();
    if (current) this.navigationService.navigate('viewOrder', { orderId: current.id });
    else this.navigationService.navigate('orders');
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

  addFiles(fileList: FileList): void {
    const additions: OrderFileEntry[] = Array.from(fileList).slice(0, 10).map((file, index) => {
      const extension = (file.name.split('.').pop() ?? '').toUpperCase();
      return {
        id: `upload-${Date.now()}-${index}`,
        name: file.name,
        type: ACCEPTED_TYPES.includes(extension) ? extension : extension || 'FILE',
        size: this.formatBytes(file.size),
        sizeBytes: file.size,
        status: 'uploading' as FileStatus,
        progress: 12,
        uploadedAt: new Date().toISOString().slice(0, 10),
        uploadedBy: 'You'
      };
    });
    if (additions.length === 0) return;
    this.files.update(current => [...additions, ...current]);
    for (const entry of additions) this.simulateUpload(entry.id);
  }

  retryUpload(fileId: string): void {
    this.files.update(current => current.map(f => (f.id === fileId ? { ...f, status: 'uploading' as FileStatus, progress: 8 } : f)));
    this.simulateUpload(fileId);
  }

  deleteFile(fileId: string): void {
    this.files.update(current => current.filter(f => f.id !== fileId));
  }

  openPreview(file: OrderFileEntry): void {
    this.previewFile.set(file);
    this.previewVisible.set(true);
  }

  closePreview(): void {
    this.previewVisible.set(false);
    this.previewFile.set(null);
  }

  downloadAll(): void {
    // Static prototype: no backend — kept as explicit no-op for parity with React Export affordance.
  }

  fileIcon(fileType: string): string {
    if (['JPG', 'PNG'].includes(fileType)) return '🖼️';
    if (fileType === 'PDF') return '📄';
    if (['STL', 'PLY', 'OBJ', 'DCM'].includes(fileType)) return '🦷';
    return '📁';
  }

  private simulateUpload(fileId: string): void {
    const timer = window.setInterval(() => {
      let finished = false;
      this.files.update(current =>
        current.map(f => {
          if (f.id !== fileId || f.status !== 'uploading') return f;
          const next = Math.min(100, f.progress + 22);
          if (next >= 100) {
            finished = true;
            return { ...f, progress: 100, status: 'uploaded' as FileStatus };
          }
          return { ...f, progress: next };
        })
      );
      if (finished) window.clearInterval(timer);
    }, 320);
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
