import {
  Component,
  input,
  output,
  contentChild,
  TemplateRef,
  computed,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { AppButtonComponent } from "../button/button.component";

@Component({
  selector: "app-empty-state",
  standalone: true,
  imports: [CommonModule, AppButtonComponent],
  templateUrl: "./empty-state.component.html",
  styleUrl: "./empty-state.component.scss",
})
export class EmptyStateComponent {
  readonly title = input<string>("No data found");
  readonly description = input<string>("Try adjusting your search or filters.");
  readonly actionLabel = input<string>("");

  readonly iconTemplate = contentChild<TemplateRef<any>>("icon");
  readonly actionTemplate = contentChild<TemplateRef<any>>("action");

  readonly hasIconSlot = computed(() => !!this.iconTemplate());
  readonly hasActionSlot = computed(() => !!this.actionTemplate());

  readonly actionClick = output<void>();
}
