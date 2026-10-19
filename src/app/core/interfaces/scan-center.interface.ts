export type ApiScanCenterResponse = ApiScanCenterItem[];

export interface ApiScanCenterItem {
  id: string;
  name: string;
  location: string;
  operator: string;
  devices: number;
  activeOrders: number;
  completedToday: number;
  status: "Operational" | "Maintenance";
}
