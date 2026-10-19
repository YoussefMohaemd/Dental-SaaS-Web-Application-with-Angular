import { Observable } from "rxjs";
import { ReportsData } from "@core/models/report.model";

export abstract class ReportsApi {
  abstract getReportsOverview(): Observable<ReportsData>;
}

