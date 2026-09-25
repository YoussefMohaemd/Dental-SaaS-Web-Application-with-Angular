import { CommonModule } from "@angular/common";
import { Component, computed, input, output } from "@angular/core";
import { PaginatorModule, PaginatorState } from "primeng/paginator";

@Component({
  selector: "app-enterprise-paginator",
  standalone: true,
  imports: [CommonModule, PaginatorModule],
  templateUrl: "./enterprise-paginator.component.html",
  styleUrl: "./enterprise-paginator.component.scss",
})
export class EnterprisePaginatorComponent {
  readonly totalRecords = input.required<number>();
  readonly rows = input<number>(10);
  readonly page = input<number>(1);
  readonly pageLinkSize = input<number>(5);

  readonly pageChange = output<number>();

  readonly firstRecord = computed(() =>
    Math.max(0, this.page() - 1) * this.rows(),
  );

  readonly rangeStart = computed(() =>
    this.totalRecords() === 0 ? 0 : this.firstRecord() + 1,
  );

  readonly rangeEnd = computed(() =>
    Math.min(this.firstRecord() + this.rows(), this.totalRecords()),
  );

  onPrimePageChange(event: PaginatorState): void {
    const nextRows = event.rows ?? this.rows();
    const nextFirst = event.first ?? 0;
    this.pageChange.emit(Math.floor(nextFirst / nextRows) + 1);
  }
}
