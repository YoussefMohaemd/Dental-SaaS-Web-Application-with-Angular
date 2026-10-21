import { Observable } from "rxjs";
import { TeamPerformanceRecord } from "@core/interfaces";

export abstract class TeamPerformanceReportApi {
  abstract getTeamPerformanceReport(): Observable<TeamPerformanceRecord[]>;
}
