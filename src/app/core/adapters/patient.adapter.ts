import { Injectable } from "@angular/core";
import { Patient } from "@core/models";
import { ApiPatientItem, ApiPatientResponse } from "@core/interfaces/patient.interface";

@Injectable({ providedIn: "root" })
export class PatientAdapter {
  PatientAdapter(response: ApiPatientResponse): Patient[] {
    return response.map((item: ApiPatientItem) => ({
      id: item.id,
      name: item.name,
      dob: item.dob,
      gender: item.gender,
      phone: item.phone,
      email: item.email,
      clinicId: item.clinicId,
      clinicName: item.clinicName,
      doctorId: item.doctorId,
      doctorName: item.doctorName,
      status: item.status,
      ordersCount: item.ordersCount,
      lastVisit: item.lastVisit,
    }));
  }
}
