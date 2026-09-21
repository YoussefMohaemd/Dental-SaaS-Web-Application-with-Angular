import { Component, input, output, model, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './select.component.html',
  styleUrl: './select.component.scss'
})
export class SelectComponent {
  readonly id = input.required<string>();
  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly value = model<string>('');
  readonly hint = input<string>('');
  readonly error = input<string>('');
  readonly options = input<{ value: string; label: string }[]>([]);

  readonly onChange = output<string>();
  readonly onBlur = output<Event>();

  readonly hintId = computed(() => `${this.id()}-hint`);
  readonly errorId = computed(() => `${this.id()}-error`);

  readonly selectClasses = computed(() => `
    select-base
    ${this.disabled() ? 'opacity-50 cursor-not-allowed' : ''}
  `);

  onChangeEvent(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.value.set(target.value);
    this.onChange.emit(target.value);
  }
}