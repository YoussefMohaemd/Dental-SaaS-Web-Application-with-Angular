import { Injectable, inject, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { EMPTY, catchError, expand, map, Observable, reduce, tap, throwError } from "rxjs";
import { LabDocument } from "../interfaces";
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
  private static readonly PAGE_SIZE = 100;

  readonly documents = this._documents.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  constructor() {
    super();
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
    return this.loadDocumentsPage(1).pipe(
      expand((pageResult) =>
        pageResult.page < pageResult.totalPages
          ? this.loadDocumentsPage(pageResult.page + 1)
          : EMPTY,
      ),
      reduce(
        (all, pageResult) => all.concat(pageResult.items),
        [] as LabDocument[],
      ),
    );
  }

  createDocument(payload: {
    name: string;
    category: LabDocument["category"];
    type: string;
    sizeBytes: number;
  }): Observable<LabDocument> {
    return this.http
      .post<{ data: LabDocument }>(this.API_URL, payload)
      .pipe(
        map((response) => this.documentAdapter.DocumentAdapter([response.data])[0]),
        tap((created) => this._documents.update((current) => [created, ...current])),
      );
  }

  deleteDocument(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      tap(() => this._documents.update((current) => current.filter((document) => document.id !== id))),
      map(() => void 0),
    );
  }

  getDocumentById(id: string): LabDocument | undefined {
    return this._documents().find((d) => d.id === id);
  }

  private loadDocumentsPage(page: number) {
    return this.http
      .get<{
        data: LabDocument[];
        meta?: {
          pagination?: {
            page?: number;
            totalPages?: number;
          };
        };
      }>(this.API_URL, {
        params: {
          page,
          pageSize: DocumentDataService.PAGE_SIZE,
        },
      })
      .pipe(
        map((response) => ({
          page:
            response.meta?.pagination?.page && response.meta.pagination.page > 0
              ? response.meta.pagination.page
              : page,
          totalPages:
            response.meta?.pagination?.totalPages &&
            response.meta.pagination.totalPages > 0
              ? response.meta.pagination.totalPages
              : 1,
          items: this.documentAdapter.DocumentAdapter(response.data ?? []),
        })),
      );
  }
}
