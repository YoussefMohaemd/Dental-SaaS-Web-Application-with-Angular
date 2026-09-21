import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-arch-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './arch-badge.component.html',
  styleUrl: './arch-badge.component.scss'
})
export class ArchBadgeComponent {
  readonly arch = input.required<string>();

  readonly archClass = computed(() => {
    const base = 'px-1 py-0.5 rounded text-[9px] font-semibold';
    if (this.arch() === 'Maxilla') return `${base} bg-blue-50 text-blue-700`;
    if (this.arch() === 'Mandible') return `${base} bg-teal-50 text-teal-700`;
    return base;
  });

  readonly archText = computed(() => {
    if (this.arch() === 'Maxilla') return 'MX';
    if (this.arch() === 'Mandible') return 'MD';
    return this.arch();
  });

  readonly isBoth = computed(() => this.arch() === 'Both');
}