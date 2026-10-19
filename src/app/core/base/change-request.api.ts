import { Observable } from "rxjs";
import { ChangeRequest } from "@core/models";

export abstract class ChangeRequestApi {
  abstract getAllChangeRequests(): Observable<ChangeRequest[]>;
}

