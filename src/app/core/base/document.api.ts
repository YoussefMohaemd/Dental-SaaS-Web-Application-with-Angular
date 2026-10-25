import { Observable } from "rxjs";
import { LabDocument } from "@core/interfaces";

export abstract class DocumentApi {
  abstract getAllDocuments(): Observable<LabDocument[]>;
  abstract createDocument(
    payload: {
      name: string;
      category: LabDocument["category"];
      type: string;
      sizeBytes: number;
    },
  ): Observable<LabDocument>;
  abstract deleteDocument(id: string): Observable<void>;
}
