import {
  Component,
  input,
  output,
  model,
  computed,
  OnInit,
  OnDestroy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  Subject,
  Subscription,
  debounceTime,
  distinctUntilChanged,
} from "rxjs";
import { AppTextFieldComponent } from "@shared/components/input/input.component";
import { AppButtonComponent } from "@shared/components/button/button.component";

export type SearchInputSize = "xs" | "sm";

@Component({
  selector: "app-search-input",
  standalone: true,
  imports: [CommonModule,  AppButtonComponent, AppTextFieldComponent],
  templateUrl: "./search-input.component.html",
  styleUrl: "./search-input.component.scss",
})
export class SearchInputComponent implements OnInit, OnDestroy {
  readonly placeholder = input<string>("Search...");
  readonly value = model<string>("");
  readonly clearable = input<boolean>(true);
  readonly type = input<"text" | "search">("search");
  readonly showShortcut = input<boolean>(false);
  readonly size = input<SearchInputSize>("sm");
  readonly debounceMs = input<number>(250);
  readonly ariaLabel = input<string>("Search");

  readonly onSearch = output<string>();
  readonly debouncedSearch = output<string>();
  readonly onBlur = output<Event>();

  private readonly searchSubject = new Subject<string>();
  private subscription: Subscription | null = null;

  readonly inputClasses = computed(() => {
    const base =
      "w-full bg-muted rounded-lg border border-border placeholder:text-muted-foreground " +
      "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors " +
      "text-foreground";

    const sizeCls =
      this.size() === "xs"
        ? "pl-8 pr-8 py-1.5 text-xs"
        : "pl-8 pr-10 py-1.5 text-sm";
    return `${base} ${sizeCls}`;
  });

  readonly clearButtonClass = computed(() => {
    const offset = this.showShortcut() ? "!right-10" : "!right-2";
    return `!absolute !top-1/2 !-translate-y-1/2 ${offset} !min-h-0 !min-w-0 !p-0.5 !rounded-md !text-muted-foreground hover:!text-foreground hover:!bg-transparent`;
  });

  ngOnInit(): void {
    this.subscription = this.searchSubject
      .pipe(debounceTime(this.debounceMs()), distinctUntilChanged())
      .subscribe((value) => this.debouncedSearch.emit(value));
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.searchSubject.complete();
  }

  onValueChanged(next: string): void {
    this.value.set(next);
    this.onSearch.emit(next);
    this.searchSubject.next(next);
  }

  clear(): void {
    this.value.set("");
    this.onSearch.emit("");
    this.searchSubject.next("");
  }
}
