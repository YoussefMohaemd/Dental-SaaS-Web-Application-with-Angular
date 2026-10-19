import { Observable } from "rxjs";
import { Case } from "@core/models";

export abstract class CaseApi {
  abstract getAllCases(): Observable<Case[]>;
}

