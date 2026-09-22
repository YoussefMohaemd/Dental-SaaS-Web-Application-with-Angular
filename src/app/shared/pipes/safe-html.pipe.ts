import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Renders trusted static markup (e.g. the inline Lucide-style icon SVGs
 * returned by each feature's `getIconSvg()` helper) via `[innerHTML]`.
 *
 * Root-cause fix: Angular's HTML sanitizer strips these icon SVGs, so every
 * `[innerHTML]="getIconSvg(...)"` binding rendered an empty span and all
 * icons were invisible. The icon strings are compile-time constants owned by
 * the app (never user input), so bypassing sanitization here is safe.
 *
 * Usage: `<span [innerHTML]="getIconSvg('plus') | safeHtml"></span>`
 */
@Pipe({ name: 'safeHtml', standalone: true })
export class SafeHtmlPipe implements PipeTransform {
  constructor(private readonly sanitizer: DomSanitizer) {}

  transform(value: string | null | undefined): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(value ?? '');
  }
}
