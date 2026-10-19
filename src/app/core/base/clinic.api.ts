import { Observable } from "rxjs";
import { Clinic } from "@core/models";

export abstract class ClinicApi {
  abstract getAllClinics(): Observable<Clinic[]>;
}

