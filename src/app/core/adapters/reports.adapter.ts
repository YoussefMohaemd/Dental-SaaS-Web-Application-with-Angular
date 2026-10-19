import { Injectable } from "@angular/core";
import { ReportsData } from "@core/interfaces";

@Injectable({ providedIn: "root" })
export class ReportsAdapter {
  ReportsAdapter(response: ReportsData): ReportsData {
    return {
      monthlyRevenue: response.monthlyRevenue.map((item) => ({ ...item })),
      restorationBreakdown: response.restorationBreakdown.map((item) => ({
        ...item,
      })),
      turnaround: response.turnaround.map((item) => ({ ...item })),
      workflowShare: response.workflowShare.map((item) => ({ ...item })),
    };
  }
}
