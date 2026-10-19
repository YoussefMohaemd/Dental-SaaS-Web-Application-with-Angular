import { Observable } from "rxjs";
import { BillingRecord } from "@core/interfaces";

export abstract class BillingApi {
  abstract getAllBillingRecords(): Observable<BillingRecord[]>;
}

