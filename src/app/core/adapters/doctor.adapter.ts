import { Injectable } from "@angular/core";
import { Doctor } from "@core/interfaces";
import { ApiDoctorItem, ApiDoctorResponse } from "@core/interfaces";

@Injectable({ providedIn: "root" })
export class DoctorAdapter {
  DoctorAdapter(response: ApiDoctorResponse): Doctor[] {
    return response.map((item: ApiDoctorItem) => ({
      id: item.id,
      lookupId: item.lookupId,
      name: item.name,
      gender: item.gender ?? "M",
      specialty: item.specialty,
      clinicId: item.clinicId,
      clinicName: item.clinicName,
      email: item.email,
      phone: item.phone,
      status: item.status,
      ordersCount: item.ordersCount,
      joinedDate: item.joinedDate,
      avatar: item.avatar,
    }));
  }
}
