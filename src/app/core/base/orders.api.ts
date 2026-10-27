import { Order } from "@core/interfaces";
import { OrderPageQuery } from "@core/services/order-data.service";

export abstract class OrdersApi {
  abstract loadOrders(query?: OrderPageQuery): void;
  abstract getOrderById(id: string): Order | undefined;
}
