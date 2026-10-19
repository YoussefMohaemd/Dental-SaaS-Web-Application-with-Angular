import { Observable } from "rxjs";
import { Clinic } from "@core/interfaces";

export abstract class ClinicApi {
  abstract getAllClinics(): Observable<Clinic[]>;
}

