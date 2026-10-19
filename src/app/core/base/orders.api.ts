import { Observable } from "rxjs";
import { Order } from "@core/models";

export abstract class OrdersApi {
  abstract getAllOrders(): Observable<Order[]>;
  abstract getOrderById(id: string): Order | undefined;
}

