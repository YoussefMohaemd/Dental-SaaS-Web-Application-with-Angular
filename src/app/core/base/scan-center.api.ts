import { Observable } from "rxjs";
import { ScanCenter } from "@core/interfaces";

export abstract class ScanCenterApi {
  abstract getAllScanCenters(): Observable<ScanCenter[]>;
}

