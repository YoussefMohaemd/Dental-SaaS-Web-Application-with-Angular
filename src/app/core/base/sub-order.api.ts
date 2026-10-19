import { Observable } from "rxjs";
import { SubOrder } from "@core/models/sub-order.model";

export abstract class SubOrderApi {
  abstract getAllSubOrders(): Observable<SubOrder[]>;
}

