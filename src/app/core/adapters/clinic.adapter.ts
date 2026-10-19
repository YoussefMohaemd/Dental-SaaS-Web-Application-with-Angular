import { Injectable } from "@angular/core";
import { Clinic } from "@core/models";
import { ApiClinicItem, ApiClinicResponse } from "@core/interfaces/clinic.interface";

@Injectable({ providedIn: "root" })
export class ClinicAdapter {
  ClinicAdapter(response: ApiClinicResponse): Clinic[] {
    return response.map((item: ApiClinicItem) => ({
      id: item.id,
      name: item.name,
      address: item.address,
      city: item.city,
      phone: item.phone,
      email: item.email,
      doctorsCount: item.doctorsCount,
      patientsCount: item.patientsCount,
      ordersCount: item.ordersCount,
      status: item.status,
      accountManager: item.accountManager,
    }));
  }
}
