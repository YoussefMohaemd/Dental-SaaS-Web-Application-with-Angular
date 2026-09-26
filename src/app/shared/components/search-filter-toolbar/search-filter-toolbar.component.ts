import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { SafeHtmlPipe } from "@shared/pipes/safe-html.pipe";
import { ButtonComponent } from "@shared/components/button/button.component";
import { InputComponent } from "@shared/components/input/input.component";
import { SelectComponent } from "@shared/components/select/select.component";

@Component({
  selector: "app-search-filter-toolbar",
  standalone: true,
  imports: [
    CommonModule,
    SafeHtmlPipe,
    ButtonComponent,
    InputComponent,
    SelectComponent,
  ],
  templateUrl: "./search-filter-toolbar.component.html",
  styleUrl: "./search-filter-toolbar.component.scss",
})
export class SearchFilterToolbarComponent {
  readonly searchId = input.required<string>();
  readonly searchPlaceholder = input<string>("Search...");
  readonly searchValue = input<string>("");
  readonly searchIconSvg = input<string>("");

  readonly selectId = input.required<string>();
  readonly selectPlaceholder = input<string>("All");
  readonly selectOptions = input<readonly string[]>([]);
  readonly selectValue = input<string>("");
  readonly selectAriaLabel = input<string>("");

  readonly actionLabel = input.required<string>();
  readonly actionAriaLabel = input<string>("");
  readonly actionIconSvg = input<string>("");
  readonly actionDisabled = input<boolean>(false);

  readonly searchValueChange = output<string>();
  readonly selectValueChange = output<string>();
  readonly actionClick = output<void>();

  onSearchChanged(value: string): void {
    this.searchValueChange.emit(value);
  }

  onSelectChanged(value: string): void {
    this.selectValueChange.emit(value);
  }

  onActionClick(): void {
    if (!this.actionDisabled()) {
      this.actionClick.emit();
    }
  }
}
