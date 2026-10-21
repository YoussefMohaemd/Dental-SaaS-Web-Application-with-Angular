import { Observable } from "rxjs";
import { OrderArchiveRecord } from "@core/interfaces";

export abstract class OrdersRangeReportApi {
  abstract getOrdersRangeReport(): Observable<OrderArchiveRecord[]>;
}
