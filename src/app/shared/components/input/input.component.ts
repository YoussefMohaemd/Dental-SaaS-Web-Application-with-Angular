import { Component, input, output, model, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss'
})
export class InputComponent {
  readonly id = input.required<string>();
  readonly type = input<'text' | 'email' | 'password' | 'tel' | 'number'>('text');
  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly value = model<string>('');
  readonly hint = input<string>('');
  readonly error = input<string>('');
  /**
   * React parity: login inputs render a 15px leading icon at `left-3` and (for
   * password) a trailing visibility toggle at `right-3`. When set, the input
   * reserves horizontal space (`pl-9` / `pr-10`) so the icon never overlaps
   * the text, placeholder, or value.
   */
  readonly iconStart = input<boolean>(false);
  readonly iconEnd = input<boolean>(false);
  readonly autocomplete = input<string>('');

  readonly onBlur = output<FocusEvent>();
  readonly onFocus = output<FocusEvent>();

  readonly hintId = computed(() => `${this.id()}-hint`);
  readonly errorId = computed(() => `${this.id()}-error`);

  readonly inputClasses = computed(() => {
    const horizontalPadding = this.iconStart() && this.iconEnd()
      ? 'pl-9 pr-10'
      : this.iconStart()
        ? 'pl-9 pr-4'
        : this.iconEnd()
          ? 'pl-3 pr-10'
          : 'px-3';
    return `
    input-base ${horizontalPadding} py-2.5
    ${this.disabled() ? 'opacity-50 cursor-not-allowed' : ''}
  `;
  });

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value.set(target.value);
  }
}