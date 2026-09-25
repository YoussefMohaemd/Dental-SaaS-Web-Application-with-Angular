import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SubOrderColorService {
  private readonly palette = [
    '#DC2626',
    '#EA580C',
    '#D97706',
    '#16A34A',
    '#0891B2',
    '#1D4ED8',
    '#7C3AED',
    '#C026D3',
  ];

  private readonly strongOverrides: Record<string, string> = {
    'fmb-fmp': '#DC2626',
    'final-restoration': '#1D4ED8',
    'other-service': '#7C3AED',
    'final-solution': '#1E40AF',
  };

  colorForSubOrderId(subOrderId: string): string {
    const index = this.hash(subOrderId) % this.palette.length;
    return this.palette[index];
  }

  colorForServiceKey(serviceKey: string): string {
    const normalized = this.canonicalServiceKey(serviceKey);
    const override = this.strongOverrides[normalized];
    if (override) return override;
    const index = this.hash(normalized) % this.palette.length;
    return this.palette[index];
  }

  colorForServiceLabel(serviceLabel: string): string {
    return this.colorForServiceKey(this.canonicalServiceKey(serviceLabel));
  }

  canonicalServiceKey(raw: string): string {
    return raw
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'other';
  }

  labelStyleForServiceKey(serviceKey: string): { [key: string]: string } {
    const color = this.colorForServiceKey(serviceKey);
    const text = this.contrastText(color);
    return {
      'background-color': `${color}22`,
      color: text,
      'border-color': `${color}66`,
    };
  }

  private hash(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
      hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
    }
    return hash;
  }

  private contrastText(hex: string): string {
    const parsed = this.parseHex(hex);
    if (!parsed) return '#0F172A';
    const { r, g, b } = parsed;
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return luminance > 0.62 ? '#0F172A' : '#FFFFFF';
  }

  private parseHex(hex: string): { r: number; g: number; b: number } | null {
    const raw = hex.replace('#', '').trim();
    if (raw.length !== 6) return null;
    const r = Number.parseInt(raw.slice(0, 2), 16);
    const g = Number.parseInt(raw.slice(2, 4), 16);
    const b = Number.parseInt(raw.slice(4, 6), 16);
    if (![r, g, b].every(Number.isFinite)) return null;
    return { r, g, b };
  }
}
