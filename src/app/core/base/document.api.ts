import { Observable } from "rxjs";
import { LabDocument } from "@core/interfaces";

export abstract class DocumentApi {
  abstract getAllDocuments(): Observable<LabDocument[]>;
}

