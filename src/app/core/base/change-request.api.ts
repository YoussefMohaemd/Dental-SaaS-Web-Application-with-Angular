import { Observable } from "rxjs";
import { ChangeRequest } from "@core/interfaces";

export abstract class ChangeRequestApi {
  abstract getAllChangeRequests(): Observable<ChangeRequest[]>;
}

