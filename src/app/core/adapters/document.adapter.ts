import { Injectable } from "@angular/core";
import { LabDocument } from "@core/models/document.model";
import {
  ApiDocumentItem,
  ApiDocumentResponse,
} from "@core/interface/document.interface";

@Injectable({ providedIn: "root" })
export class DocumentAdapter {
  DocumentAdapter(response: ApiDocumentResponse): LabDocument[] {
    return response.map((item: ApiDocumentItem) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      type: item.type,
      size: item.size,
      date: item.date,
      doctor: item.doctor,
      patientName: item.patientName,
      orderId: item.orderId,
      orderNumber: item.orderNumber,
      subOrderId: item.subOrderId,
    }));
  }
}
