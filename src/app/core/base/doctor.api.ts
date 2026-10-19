import { Observable } from "rxjs";
import { Doctor } from "@core/interfaces";

export abstract class DoctorApi {
  abstract getAllDoctors(): Observable<Doctor[]>;
}

