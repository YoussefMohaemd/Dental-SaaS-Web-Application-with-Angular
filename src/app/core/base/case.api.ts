import { Observable } from "rxjs";
import { Case } from "@core/interfaces";

export abstract class CaseApi {
  abstract getAllCases(): Observable<Case[]>;
}

