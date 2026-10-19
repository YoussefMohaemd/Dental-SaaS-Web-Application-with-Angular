import { Observable } from "rxjs";
import { LabDocument } from "@core/models/document.model";

export abstract class DocumentApi {
  abstract getAllDocuments(): Observable<LabDocument[]>;
}

