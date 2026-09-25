import { Injectable, inject, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { of, catchError } from "rxjs";
import { LabDocument } from "../models/document.model";

@Injectable({ providedIn: "root" })
export class DocumentDataService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = "/data/documents.json";

  private readonly _documents = signal<LabDocument[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly documents = this._documents.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  constructor() {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this._loading.set(true);
    this._error.set(null);

    this.http
      .get<LabDocument[]>(this.API_URL)
      .pipe(
        catchError((err) => {
          this._error.set("Failed to load documents");
          console.error("Error loading documents:", err);
          return of([] as LabDocument[]);
        }),
      )
      .subscribe({
        next: (documents: LabDocument[]) => {
          this._documents.set(documents);
          this._loading.set(false);
        },
        error: () => {
          this._loading.set(false);
        },
      });
  }

  getDocumentById(id: string): LabDocument | undefined {
    return this._documents().find((d) => d.id === id);
  }
}
