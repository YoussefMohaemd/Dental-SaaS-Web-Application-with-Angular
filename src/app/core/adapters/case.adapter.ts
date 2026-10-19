import { Injectable } from "@angular/core";
import { Case } from "@core/models";
import { ApiCaseItem, ApiCaseResponse } from "@core/interface/case.interface";

@Injectable({ providedIn: "root" })
export class CaseAdapter {
  CaseAdapter(response: ApiCaseResponse): Case[] {
    return response.map((item: ApiCaseItem) => ({
      id: item.id,
      caseNumber: item.caseNumber,
      title: item.title,
      patientId: item.patientId,
      patientName: item.patientName,
      doctorId: item.doctorId,
      doctorName: item.doctorName,
      clinicId: item.clinicId,
      clinicName: item.clinicName,
      status: item.status,
      priority: item.priority,
      ordersCount: item.ordersCount,
      filesCount: item.filesCount,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      notes: item.notes,
    }));
  }
}
