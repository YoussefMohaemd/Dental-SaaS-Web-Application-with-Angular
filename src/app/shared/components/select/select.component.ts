import { CommonModule } from "@angular/common";
import { Component, computed, input, model } from "@angular/core";

@Component({
  selector: "app-select",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./select.component.html",
  styleUrl: "./select.component.scss",
})
export class SelectComponent {
  readonly id = input.required<string>();
  readonly label = input<string>("");
  readonly placeholder = input<string>("");
  readonly options = input<readonly string[]>([]);
  readonly value = model<string>("");
  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly ariaLabel = input<string>("");

  readonly selectId = computed(() => this.id());

  onChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.value.set(target.value);
  }
}
