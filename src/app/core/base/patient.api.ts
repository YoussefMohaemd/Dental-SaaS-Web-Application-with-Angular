import { Observable } from "rxjs";
import { Patient } from "@core/models";

export abstract class PatientApi {
  abstract getAllPatients(): Observable<Patient[]>;
}

