import { Observable } from "rxjs";
import { VolumeWeek } from "@core/interfaces";

export abstract class DashboardApi {
  abstract getVolumeWeeks(): Observable<VolumeWeek[]>;
}
