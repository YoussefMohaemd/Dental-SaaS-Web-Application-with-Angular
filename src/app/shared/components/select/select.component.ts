import { CommonModule } from "@angular/common";
import {
  Component,
  computed,
  forwardRef,
  input,
  model,
  signal,
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { TuiLabel } from "@taiga-ui/core/components/label";

type SelectOption = string | { label: string; value: string };

@Component({
  selector: "app-select",
  standalone: true,
  imports: [CommonModule, TuiLabel],
  templateUrl: "./select.component.html",
  styleUrl: "./select.component.scss",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
})
export class SelectComponent implements ControlValueAccessor {
  private static nextAutoId = 0;

  readonly id = input<string>("");
  readonly label = input<string>("");
  readonly placeholder = input<string>("");
  readonly options = input<readonly SelectOption[]>([]);
  readonly value = model<string>("");
  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly ariaLabel = input<string>("");
  readonly unstyled = input<boolean>(false);
  readonly selectClass = input<string>("");
  readonly wrapperClass = input<string>("");
  readonly labelClass = input<string>("");

  private readonly cvaDisabled = signal(false);
  private onChangeFn: (value: string) => void = () => {};
  private onTouchedFn: () => void = () => {};
  private readonly generatedId = `app-select-${SelectComponent.nextAutoId++}`;

  readonly selectId = computed(() => this.id().trim() || this.generatedId);
  readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());
  readonly normalizedOptions = computed(() =>
    this.options().map((option) =>
      typeof option === "string"
        ? { label: option, value: option }
        : { label: option.label, value: option.value },
    ),
  );

  readonly classes = computed(() => {
    if (this.unstyled()) {
      return `${this.selectClass()} ${this.isDisabled() ? "opacity-50 cursor-not-allowed" : ""}`;
    }
    return `select-base py-2 text-sm ${this.isDisabled() ? "opacity-50 cursor-not-allowed" : ""} ${this.selectClass()}`;
  });

  onChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.value.set(target.value);
    this.onChangeFn(target.value);
  }

  onBlur(): void {
    this.onTouchedFn();
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? "");
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }
}
