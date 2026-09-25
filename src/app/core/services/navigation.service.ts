import { Injectable, signal, computed, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { PageId, NavParams, NavItem, BreadcrumbItem, NAV_ITEMS, BREADCRUMB_MAP } from '../models';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly router = inject(Router);

  readonly currentPage = signal<PageId>('dashboard');
  readonly currentParams = signal<NavParams>({});
  readonly sidebarOpen = signal<boolean>(true);
  readonly searchOpen = signal<boolean>(false);
  readonly notificationsOpen = signal<boolean>(false);
  readonly profileOpen = signal<boolean>(false);

  readonly navItems = signal<NavItem[]>(NAV_ITEMS);

  readonly activeGroup = computed(() => {
    const page = this.currentPage();
    if (['orders', 'viewOrder', 'orderWorkflow', 'orderFiles', 'createOrder', 'editOrder'].includes(page)) return 'orders';
    if (['cases', 'caseDetails'].includes(page)) return 'cases';
    if (['patients', 'patientDetails'].includes(page)) return 'patients';
    if (['doctors', 'doctorDetails'].includes(page)) return 'doctors';
    if (['clinics', 'clinicDetails'].includes(page)) return 'clinics';
    return page;
  });

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const page = this.currentPage();
    const params = this.currentParams();
    const crumbs: BreadcrumbItem[] = [];
    let current: PageId | undefined = page;

    while (current) {
      const info = BREADCRUMB_MAP[current] as { label: string; parent?: PageId } | undefined;
      if (!info) break;
      const crumb: BreadcrumbItem = { label: info.label, page: current === page ? undefined : current };
      if (current === 'viewOrder' && params.orderId) {
        crumb.params = { orderId: params.orderId };
      }
      crumbs.unshift(crumb);
      current = info.parent;
    }
    return crumbs;
  });

  readonly unreadNotificationsCount = signal<number>(3);

  constructor() {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const url = event.urlAfterRedirects;
      this.updateStateFromUrl(url);
    });
  }

  private updateStateFromUrl(url: string): void {
    const segments = url.split('/').filter(Boolean);
    if (segments.length === 0) {
      this.currentPage.set('dashboard');
      this.currentParams.set({});
      return;
    }

    const pageMap: Record<string, PageId> = {
      'dashboard': 'dashboard',
      'orders': 'orders',
      'cases': 'cases',
      'workflow-board': 'workflowBoard',
      'scan-center': 'scanCenter',
      'patients': 'patients',
      'doctors': 'doctors',
      'clinics': 'clinics',
      'documents': 'documents',
      'billing': 'billing',
      'change-requests': 'changeRequests',
      'reports': 'reports',
      'notifications': 'notifications',
      'settings': 'settings',
      'grid': 'grid',
      'forms': 'forms'
    };

    const firstSegment = segments[0];

    
    
    
    if (firstSegment === 'login') {
      this.currentPage.set('login');
      this.currentParams.set({});
      return;
    }

    
    
    
    if (firstSegment === 'orders') {
      if (segments[1] === 'create') {
        this.currentPage.set('createOrder');
        this.currentParams.set({});
        return;
      }
      if (segments[1]) {
        const params: NavParams = { orderId: segments[1] };
        if (segments[2] === 'sub-orders' && segments[3]) {
          this.currentPage.set('subOrder');
          params.subOrderId = segments[3];
          this.currentParams.set(params);
          return;
        }
        const nestedMap: Record<string, PageId> = {
          edit: 'editOrder',
          workflow: 'orderWorkflow',
          files: 'orderFiles',
        };
        const nested = segments[2] ? nestedMap[segments[2]] : undefined;
        this.currentPage.set(nested ?? 'viewOrder');
        this.currentParams.set(params);
        return;
      }
      this.currentPage.set('orders');
      this.currentParams.set({});
      return;
    }

    const pageId = pageMap[firstSegment] || 'dashboard';
    this.currentPage.set(pageId);

    const params: NavParams = {};
    if (segments[1]) {
      if (firstSegment === 'patients') {
        params.patientId = segments[1];
      } else if (firstSegment === 'doctors') {
        params.doctorId = segments[1];
      } else if (firstSegment === 'clinics') {
        params.clinicId = segments[1];
      } else if (firstSegment === 'cases') {
        params.caseId = segments[1];
      }
    }
    this.currentParams.set(params);
  }

  navigate(page: PageId, params?: NavParams): void {
    
    
    
    
    if (page === 'login') {
      this.router.navigate(['/login']);
      this.closeDropdowns();
      return;
    }
    const routeMap: Partial<Record<PageId, (params: NavParams) => string>> = {
      dashboard: () => '/dashboard',
      orders: () => '/orders',
      viewOrder: (p) => `/orders/${p.orderId}`,
      orderWorkflow: (p) => `/orders/${p.orderId}/workflow`,
      orderFiles: (p) => `/orders/${p.orderId}/files`,
      createOrder: () => '/orders/create',
      editOrder: (p) => `/orders/${p.orderId}/edit`,
      cases: () => '/cases',
      caseDetails: (p) => `/cases/${p.caseId}`,
      workflowBoard: () => '/workflow-board',
      scanCenter: () => '/scan-center',
      patients: () => '/patients',
      patientDetails: (p) => `/patients/${p.patientId}`,
      doctors: () => '/doctors',
      doctorDetails: (p) => `/doctors/${p.doctorId}`,
      clinics: () => '/clinics',
      clinicDetails: (p) => `/clinics/${p.clinicId}`,
      documents: () => '/documents',
      billing: () => '/billing',
      changeRequests: () => '/change-requests',
      reports: () => '/reports',
      notifications: () => '/notifications',
      settings: () => '/settings',
      grid: () => '/grid',
      forms: () => '/forms',
      
      subOrder: (p) => `/orders/${p.orderId}/sub-orders/${p.subOrderId}${p.subOrderTab ? `?tab=${p.subOrderTab}` : ''}`
    };

    const routeBuilder = routeMap[page];
    if (routeBuilder) {
      this.router.navigateByUrl(routeBuilder(params || {}));
      this.closeDropdowns();
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  setSidebarOpen(open: boolean): void {
    this.sidebarOpen.set(open);
  }

  toggleSearch(): void {
    this.searchOpen.update(v => !v);
  }

  toggleNotifications(): void {
    this.notificationsOpen.update(v => !v);
    if (this.notificationsOpen()) {
      this.profileOpen.set(false);
    }
  }

  toggleProfile(): void {
    this.profileOpen.update(v => !v);
    if (this.profileOpen()) {
      this.notificationsOpen.set(false);
    }
  }

  closeDropdowns(): void {
    this.notificationsOpen.set(false);
    this.profileOpen.set(false);
  }

  markNotificationsRead(): void {
    this.unreadNotificationsCount.set(0);
  }
}