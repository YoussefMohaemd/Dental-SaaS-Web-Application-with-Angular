import { Injectable } from "@angular/core";
import { ChangeRequest } from "@core/models";
import {
  ApiChangeRequestItem,
  ApiChangeRequestResponse,
} from "@core/interfaces/change-request.interface";

@Injectable({ providedIn: "root" })
export class ChangeRequestAdapter {
  ChangeRequestAdapter(response: ApiChangeRequestResponse): ChangeRequest[] {
    return response.map((item: ApiChangeRequestItem) => ({
      id: item.id,
      requestNumber: item.requestNumber,
      orderId: item.orderId,
      orderNumber: item.orderNumber,
      patientName: item.patientName,
      requester: item.requester,
      status: item.status,
      priority: item.priority,
      description: item.description,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
  }
}
