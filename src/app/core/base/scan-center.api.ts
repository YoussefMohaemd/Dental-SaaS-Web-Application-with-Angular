import { Observable } from "rxjs";
import { ScanCenter } from "@core/models";

export abstract class ScanCenterApi {
  abstract getAllScanCenters(): Observable<ScanCenter[]>;
}

