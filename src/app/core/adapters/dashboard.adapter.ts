import { Injectable } from "@angular/core";
import { VolumeWeek } from "@core/models";

@Injectable({ providedIn: "root" })
export class DashboardAdapter {
  DashboardAdapter(response: VolumeWeek[]): VolumeWeek[] {
    return response.map((week) => ({
      ...week,
      days: week.days.map((day) => ({ ...day })),
    }));
  }
}
