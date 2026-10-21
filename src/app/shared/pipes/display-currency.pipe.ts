import { Pipe, PipeTransform } from "@angular/core";

@Pipe({ name: "displayCurrency", standalone: true })
export class DisplayCurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined, currency = "USD"): string {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return "—";
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(Number(value));
  }
}
