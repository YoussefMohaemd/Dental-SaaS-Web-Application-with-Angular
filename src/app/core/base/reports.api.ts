import { Observable } from "rxjs";
import { ReportsData } from "@core/interfaces";

export abstract class ReportsApi {
  abstract getReportsOverview(): Observable<ReportsData>;
}

