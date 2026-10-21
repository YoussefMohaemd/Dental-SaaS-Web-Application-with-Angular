import { Injectable } from "@angular/core";
import { TeamPerformanceRecord } from "@core/interfaces";

@Injectable({ providedIn: "root" })
export class TeamPerformanceReportAdapter {
  adapt(rows: TeamPerformanceRecord[]): TeamPerformanceRecord[] {
    return rows.map((row) => ({
      ...row,
      completedOrders: Number(row.completedOrders) || 0,
      revenueCollected: Number(row.revenueCollected) || 0,
      avgTurnaroundDays: Number(row.avgTurnaroundDays) || 0,
      onTimeRate: Number(row.onTimeRate) || 0,
    }));
  }
}
