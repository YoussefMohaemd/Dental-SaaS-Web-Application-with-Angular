import { Observable } from "rxjs";
import { Order } from "@core/interfaces";

export abstract class OrdersApi {
  abstract getAllOrders(): Observable<Order[]>;
  abstract getOrderById(id: string): Order | undefined;
}

