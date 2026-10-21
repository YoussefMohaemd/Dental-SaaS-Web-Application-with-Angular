import { Injectable } from "@angular/core";
import { OrderArchiveRecord } from "@core/interfaces";

@Injectable({ providedIn: "root" })
export class OrdersRangeReportAdapter {
  adapt(rows: OrderArchiveRecord[]): OrderArchiveRecord[] {
    return rows.map((row) => ({
      ...row,
      amount: Number(row.amount) || 0,
      vouchers: Number(row.vouchers) || 0,
      chargedAt: row.chargedAt ?? null,
    }));
  }
}
