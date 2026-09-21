import { Component, input, output, model, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.scss'
})
export class SearchInputComponent {
  readonly placeholder = input<string>('Search...');
  readonly value = model<string>('');
  readonly clearable = input<boolean>(true);
  readonly type = input<'text' | 'search'>('search');
  readonly showShortcut = input<boolean>(false);

  readonly onSearch = output<string>();
  readonly onBlur = output<Event>();

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value.set(target.value);
    this.onSearch.emit(target.value);
  }

  clear(): void {
    this.value.set('');
    this.onSearch.emit('');
  }
}