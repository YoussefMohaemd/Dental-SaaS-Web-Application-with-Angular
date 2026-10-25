import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { catchError, map, of } from "rxjs";
import { OrderDataService } from "@core/services/order-data.service";

export const orderUnlockedGuard: CanActivateFn = (route) => {
  const orderId = route.paramMap.get("orderId");
  const router = inject(Router);
  const orderService = inject(OrderDataService);

  if (!orderId) return router.parseUrl("/orders");

  const cachedOrder = orderService.getOrderById(orderId);
  if (cachedOrder) {
    return cachedOrder.isLocked ? router.parseUrl("/orders") : true;
  }

  return orderService.getOrderById$(orderId).pipe(
    map((order) => (order.isLocked ? router.parseUrl("/orders") : true)),
    catchError(() => of(router.parseUrl("/orders"))),
  );
};
