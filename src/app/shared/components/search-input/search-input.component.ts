import { Component, input, output, model, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';

export type SearchInputSize = 'xs' | 'sm';

/**
 * Shared search input (Taiga-light + Tailwind visuals, React parity).
 * - `onSearch` emits immediately for model sync (back-compat).
 * - `debouncedSearch` emits via RxJS debounceTime for filtering workloads.
 */
@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.scss'
})
export class SearchInputComponent implements OnInit, OnDestroy {
  readonly placeholder = input<string>('Search...');
  readonly value = model<string>('');
  readonly clearable = input<boolean>(true);
  readonly type = input<'text' | 'search'>('search');
  readonly showShortcut = input<boolean>(false);
  readonly size = input<SearchInputSize>('sm');
  readonly debounceMs = input<number>(250);
  readonly ariaLabel = input<string>('Search');

  readonly onSearch = output<string>();
  readonly debouncedSearch = output<string>();
  readonly onBlur = output<Event>();

  private readonly searchSubject = new Subject<string>();
  private subscription: Subscription | null = null;

  readonly inputClasses = computed(() => {
    const base =
      'w-full bg-muted rounded-lg border border-border placeholder:text-muted-foreground ' +
      'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors ' +
      'text-foreground';
    // React parity: header search is text-sm, toolbar search is text-xs; both py-1.5 with pl-8.
    const sizeCls = this.size() === 'xs' ? 'pl-8 pr-8 py-1.5 text-xs' : 'pl-8 pr-10 py-1.5 text-sm';
    return `${base} ${sizeCls}`;
  });

  ngOnInit(): void {
    this.subscription = this.searchSubject
      .pipe(debounceTime(this.debounceMs()), distinctUntilChanged())
      .subscribe(value => this.debouncedSearch.emit(value));
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.searchSubject.complete();
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value.set(target.value);
    this.onSearch.emit(target.value);
    this.searchSubject.next(target.value);
  }

  clear(): void {
    this.value.set('');
    this.onSearch.emit('');
    this.searchSubject.next('');
  }
}
