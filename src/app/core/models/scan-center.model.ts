export interface ScanCenter {
  id: string;
  name: string;
  location: string;
  operator: string;
  devices: number;
  activeOrders: number;
  completedToday: number;
  status: 'Operational' | 'Maintenance';
}

export interface ScanCenterFilters {
  statusFilter?: ScanCenter['status'];
  sortColumn?: keyof ScanCenter;
  sortDirection?: 'asc' | 'desc';
}