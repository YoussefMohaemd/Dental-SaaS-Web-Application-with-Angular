import { Injectable } from "@angular/core";
import { BillingRecord } from "@core/models";
import { ApiBillingItem, ApiBillingResponse } from "@core/interfaces/billing.interface";

@Injectable({ providedIn: "root" })
export class BillingAdapter {
  BillingAdapter(response: ApiBillingResponse): BillingRecord[] {
    return response.map((item: ApiBillingItem) => ({
      id: item.id,
      orderId: item.orderId,
      orderNumber: item.orderNumber,
      patientName: item.patientName,
      doctorName: item.doctorName,
      clinicName: item.clinicName,
      amount: item.amount,
      status: item.status,
      invoiceNumber: item.invoiceNumber,
      invoiceDate: item.invoiceDate,
      dueDate: item.dueDate,
      paidDate: item.paidDate,
      vouchers: item.vouchers,
      notes: item.notes,
    }));
  }
}
