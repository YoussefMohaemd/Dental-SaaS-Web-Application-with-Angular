import { Injectable, inject, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError, map, throwError } from "rxjs";
import { LabDocument } from "../models/document.model";
import { ApiResponse } from "@core/interfaces/api-response.interface";
import { ApiEndpoint } from "@core/enum/api.endpoint";
import { DocumentApi } from "@core/base/document.api";
import { DocumentAdapter } from "@core/adapters/document.adapter";

@Injectable({ providedIn: "root" })
export class DocumentDataService extends DocumentApi {
  private readonly http = inject(HttpClient);
  private readonly documentAdapter = inject(DocumentAdapter);
  private readonly API_URL = ApiEndpoint.DOCUMENTS;

  private readonly _documents = signal<LabDocument[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly documents = this._documents.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  constructor() {
    super();
    this.loadDocuments();
  }

  loadDocuments(): void {
    this._loading.set(true);
    this._error.set(null);

    this.getAllDocuments()
      .pipe(
        catchError((apiError) => {
          console.error("Error loading documents:", apiError);
          return throwError(() => apiError);
        }),
      )
      .subscribe({
        next: (documents: LabDocument[]) => {
          this._documents.set(documents);
          this._loading.set(false);
        },
        error: () => {
          this._error.set("Failed to load documents");
          this._documents.set([]);
          this._loading.set(false);
        },
      });
  }

  getAllDocuments() {
    return this.http
      .get<ApiResponse<LabDocument[]>>(this.API_URL)
      .pipe(
        map((response) => response.data ?? []),
        map((rows) => this.documentAdapter.DocumentAdapter(rows)),
      );
  }

  getDocumentById(id: string): LabDocument | undefined {
    return this._documents().find((d) => d.id === id);
  }
}
