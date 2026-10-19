import { Observable } from "rxjs";
import { Doctor } from "@core/models";

export abstract class DoctorApi {
  abstract getAllDoctors(): Observable<Doctor[]>;
}

