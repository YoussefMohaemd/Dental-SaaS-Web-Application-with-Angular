import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { DialogModule } from "primeng/dialog";

@Component({
  selector: "app-entity-dialog",
  standalone: true,
  imports: [CommonModule, DialogModule],
  templateUrl: "./entity-dialog.component.html",
  styleUrl: "./entity-dialog.component.scss",
})
export class EntityDialogComponent {
  readonly visible = input<boolean>(false);
  readonly title = input.required<string>();
  readonly subtitle = input<string>("");
  readonly width = input<string>("32rem");
  readonly dismissableMask = input<boolean>(true);

  readonly visibleChange = output<boolean>();
  readonly closed = output<void>();

  onDialogVisibleChange(next: boolean): void {
    this.visibleChange.emit(next);
  }

  onDialogHide(): void {
    this.visibleChange.emit(false);
    this.closed.emit();
  }
}
