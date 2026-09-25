import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CaseDataService } from '@core/services/case-data.service';
import { OrderDataService } from '@core/services/order-data.service';
import { NavigationService } from '@core/services/navigation.service';
import { FormatUtils } from '@core/services/format-utils.service';
import { Case, Order } from '@core/models';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { PriorityBadgeComponent } from '@shared/components/priority-badge/priority-badge.component';
import { SafeHtmlPipe } from '@shared/pipes/safe-html.pipe';

interface FileItem {
  name: string;
  type: string;
  size: string;
  date: string;
}

interface ActivityItem {
  user: string;
  action: string;
  time: string;
}

@Component({
  selector: 'app-case-details',
  standalone: true,
  imports: [
    CommonModule,
    StatusBadgeComponent,
    PriorityBadgeComponent,
    ButtonComponent,
    SafeHtmlPipe
  ],
  templateUrl: './case-details.component.html',
  styleUrl: './case-details.component.scss'
})
export class CaseDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly caseService = inject(CaseDataService);
  private readonly orderService = inject(OrderDataService);
  protected readonly navigationService = inject(NavigationService);
  protected readonly formatUtils = inject(FormatUtils);

  readonly case = signal<Case | null>(null);
  readonly caseOrders = signal<Order[]>([]);

  readonly tabs = ['Overview', 'Files', 'Notes', 'Activity'];
  readonly activeTab = signal<string>('Overview');

  readonly dummyFiles: FileItem[] = [
    { name: 'full_arch_upper.stl', type: 'STL', size: '4.2 MB', date: '2024-12-10' },
    { name: 'full_arch_lower.stl', type: 'STL', size: '3.8 MB', date: '2024-12-10' },
    { name: 'bite_scan.stl', type: 'STL', size: '1.1 MB', date: '2024-12-10' },
    { name: 'patient_photos.zip', type: 'ZIP', size: '14.2 MB', date: '2024-12-08' }
  ];

  readonly activityItems = signal<ActivityItem[]>([]);

  private caseId = '';

  ngOnInit(): void {
    this.caseId = this.route.snapshot.paramMap.get('caseId') || '';
    this.loadCase();
  }

  private loadCase(): void {
    const c = this.caseService.getCaseById(this.caseId);
    if (c) {
      this.case.set(c);
      
      const patientOrders = this.orderService.getOrdersByPatient(c.patientId).slice(0, c.ordersCount);
      this.caseOrders.set(patientOrders);

      
      this.activityItems.set([
        { user: 'K. Patel', action: 'uploaded 4 scan files', time: c.updatedAt },
        { user: 'T. Anderson', action: 'reviewed case details', time: c.createdAt },
        { user: 'Jessica R.', action: 'created case', time: c.createdAt }
      ]);
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab.set(tab);
  }

  goBack(): void {
    this.navigationService.navigate('cases');
  }

  navigateToPatient(patientId: string): void {
    this.navigationService.navigate('patientDetails', { patientId });
  }

  navigateToDoctor(doctorId: string): void {
    this.navigationService.navigate('doctorDetails', { doctorId });
  }

  navigateToClinic(clinicId: string): void {
    this.navigationService.navigate('clinicDetails', { clinicId });
  }

  navigateToOrder(orderId: string): void {
    this.navigationService.navigate('viewOrder', { orderId });
  }

  getStatusColors(status: string): string {
    const colors: Record<string, string> = {
      'Open': 'bg-blue-50 text-blue-700',
      'In Progress': 'bg-amber-50 text-amber-700',
      'Review': 'bg-violet-50 text-violet-700',
      'Closed': 'bg-muted text-muted-foreground'
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  }

  getIconSvg(name: string): string {
    const icons: Record<string, string> = {
      'arrow-left': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>',
      'external-link': '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>',
      'file-text': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>'
    };
    return icons[name] || '';
  }
}