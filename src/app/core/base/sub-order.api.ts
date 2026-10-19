import { Observable } from "rxjs";
import { SubOrder } from "@core/interfaces";

export abstract class SubOrderApi {
  abstract getAllSubOrders(): Observable<SubOrder[]>;
}

