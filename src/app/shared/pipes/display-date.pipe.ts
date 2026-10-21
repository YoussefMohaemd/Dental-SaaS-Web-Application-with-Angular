import { Pipe, PipeTransform } from "@angular/core";

@Pipe({ name: "displayDate", standalone: true })
export class DisplayDatePipe implements PipeTransform {
  transform(
    value: string | Date | null | undefined,
    includeTime = false,
  ): string {
    if (!value) return "—";

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    const formatted = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      ...(includeTime
        ? { hour: "numeric", minute: "2-digit", hour12: true }
        : {}),
    }).format(date);

    return formatted;
  }
}
