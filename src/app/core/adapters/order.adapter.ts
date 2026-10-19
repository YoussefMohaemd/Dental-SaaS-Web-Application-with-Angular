import { Injectable } from "@angular/core";
import { Order } from "@core/models";
import { ApiOrderItem, ApiOrderResponse } from "@core/interface/order.interface";

@Injectable({ providedIn: "root" })
export class OrderAdapter {
  OrdersAdapter(rawRes: ApiOrderResponse): Order[] {
    return rawRes.map((item: ApiOrderItem) => ({
      id: item.id,
      orderNumber: item.orderNumber,
      patientId: item.patientId,
      patientName: item.patientName,
      doctorId: item.doctorId,
      doctorName: item.doctorName,
      clinicId: item.clinicId,
      clinicName: item.clinicName,
      scanCenterId: item.scanCenterId,
      scanCenterName: item.scanCenterName,
      status: item.status,
      priority: item.priority,
      restoration: item.restoration,
      arch: item.arch,
      format: item.format,
      shade: item.shade,
      units: item.units,
      amount: item.amount,
      billed: item.billed,
      billedAmount: item.billedAmount,
      billTo: item.billTo,
      vouchers: item.vouchers,
      isLocked: item.isLocked,
      hasNotes: item.hasNotes,
      notes: item.notes,
      archiveDate: item.archiveDate,
      receivedAt: item.receivedAt,
      sentAt: item.sentAt,
      updatedAt: item.updatedAt,
      chargedAt: item.chargedAt,
      dueDate: item.dueDate,
      changeRequest: item.changeRequest,
      csTask: item.csTask,
      technicianId: item.technicianId,
      technicianName: item.technicianName,
      creationData: this.adaptCreationData(item.creationData),
    }));
  }

  private adaptCreationData(creationData: ApiOrderItem["creationData"]): Order["creationData"] {
    if (!creationData) return undefined;
    return {
      services: creationData.services.map((service) => ({
        serviceId: service.serviceId,
        serviceDetails: { ...service.serviceDetails },
        serviceForm: { ...service.serviceForm },
        selectedTeeth: [...service.selectedTeeth],
        scanRequirements: [...service.scanRequirements],
        fileReferences: [...service.fileReferences],
      })),
      communication: creationData.communication
        ? {
            internalCaseNote: creationData.communication.internalCaseNote,
            internalCaseFiles: [...creationData.communication.internalCaseFiles],
            sendMailTo: [...creationData.communication.sendMailTo],
            sendIhTaskTo: creationData.communication.sendIhTaskTo,
            rushTask: creationData.communication.rushTask,
          }
        : undefined,
    };
  }
}
