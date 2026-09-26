import {
  Component,
  computed,
  forwardRef,
  input,
  model,
  output,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";

@Component({
  selector: "app-input",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./input.component.html",
  styleUrls: ["./input.component.scss"],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppTextFieldComponent),
      multi: true,
    },
  ],
})
export class AppTextFieldComponent implements ControlValueAccessor {
  private static nextAutoId = 0;

  readonly id = input<string>("");
  readonly type = input<
    "text" | "email" | "password" | "tel" | "number" | "date" | "search"
  >("text");
  readonly label = input<string>("");
  readonly placeholder = input<string>("");
  readonly ariaLabel = input<string>("");
  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly value = model<string>("");
  readonly hint = input<string>("");
  readonly error = input<string>("");
  readonly readOnly = input<boolean>(false);
  readonly unstyled = input<boolean>(false);
  readonly inputClass = input<string>("");
  readonly containerClass = input<string>("");
  readonly labelClass = input<string>("");
  readonly iconStart = input<boolean>(false);
  readonly iconEnd = input<boolean>(false);
  readonly autocomplete = input<string>("");
  readonly onBlur = output<FocusEvent>();
  readonly onFocus = output<FocusEvent>();

  private readonly cvaDisabled = signal(false);
  private onChangeFn: (value: string) => void = () => {};
  private onTouchedFn: () => void = () => {};
  private readonly generatedId = `app-input-${AppTextFieldComponent.nextAutoId++}`;

  readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());
  readonly controlId = computed(() => this.id().trim() || this.generatedId);

  readonly hintId = computed(() => `${this.controlId()}-hint`);
  readonly errorId = computed(() => `${this.controlId()}-error`);
  readonly resolvedAriaLabel = computed(() => {
    const explicit = this.ariaLabel().trim();
    if (explicit) return explicit;
    const label = this.label().trim();
    if (label) return label;
    const placeholder = this.placeholder().trim();
    return placeholder || null;
  });

  readonly inputClasses = computed(() => {
    const horizontalPadding =
      this.iconStart() && this.iconEnd()
        ? "pl-9 pr-10"
        : this.iconStart()
          ? "pl-9 pr-4"
          : this.iconEnd()
            ? "pl-3 pr-10"
            : "px-3";
    const readonlyClass = this.readOnly() ? "cursor-not-allowed bg-muted" : "";
    if (this.unstyled()) {
      return `${this.inputClass()} ${this.isDisabled() ? "opacity-[var(--disabled-opacity)] cursor-not-allowed" : ""} ${readonlyClass}`;
    }
    return `
    input-base ${horizontalPadding} py-2.5
    ${this.isDisabled() ? "opacity-[var(--disabled-opacity)] cursor-not-allowed" : ""}
    ${readonlyClass}
    ${this.inputClass()}
  `;
  });

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value.set(target.value);
    this.onChangeFn(target.value);
  }

  onNativeBlur(event: FocusEvent): void {
    this.onTouchedFn();
    this.onBlur.emit(event);
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
