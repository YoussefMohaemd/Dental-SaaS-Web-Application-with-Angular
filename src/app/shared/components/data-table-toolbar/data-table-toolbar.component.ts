import { CommonModule } from "@angular/common";
import { Component, input } from "@angular/core";

@Component({
  selector: "app-data-table-toolbar",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./data-table-toolbar.component.html",
  styleUrl: "./data-table-toolbar.component.scss",
})
export class DataTableToolbarComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>("");
}
