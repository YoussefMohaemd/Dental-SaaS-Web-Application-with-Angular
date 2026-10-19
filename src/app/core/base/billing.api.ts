import { Observable } from "rxjs";
import { BillingRecord } from "@core/models";

export abstract class BillingApi {
  abstract getAllBillingRecords(): Observable<BillingRecord[]>;
}

