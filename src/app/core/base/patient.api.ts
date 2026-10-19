import { Observable } from "rxjs";
import { Patient } from "@core/interfaces";

export abstract class PatientApi {
  abstract getAllPatients(): Observable<Patient[]>;
}

