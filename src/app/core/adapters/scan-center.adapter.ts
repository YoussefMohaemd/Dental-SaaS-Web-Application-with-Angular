import { Injectable } from "@angular/core";
import { ScanCenter } from "@core/models";
import {
  ApiScanCenterItem,
  ApiScanCenterResponse,
} from "@core/interfaces/scan-center.interface";

@Injectable({ providedIn: "root" })
export class ScanCenterAdapter {
  ScanCenterAdapter(response: ApiScanCenterResponse): ScanCenter[] {
    return response.map((item: ApiScanCenterItem) => ({
      id: item.id,
      name: item.name,
      location: item.location,
      operator: item.operator,
      devices: item.devices,
      activeOrders: item.activeOrders,
      completedToday: item.completedToday,
      status: item.status,
    }));
  }
}
