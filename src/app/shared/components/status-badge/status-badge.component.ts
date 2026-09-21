import { Component, input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormatUtils } from '../../../core/services/format-utils.service';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss'
})
export class StatusBadgeComponent {
  readonly status = input.required<string>();
  readonly size = input<'xs' | 'sm' | 'md'>('xs');

  private readonly formatUtils = inject(FormatUtils);

  readonly styles = computed(() => this.formatUtils.getStatusStyles(this.status()));

  readonly badgeClasses = computed(() => {
    const base = 'inline-flex items-center px-1.5 py-0.5 rounded font-semibold';
    const sizes = { xs: 'text-[10px]', sm: 'text-xs', md: 'text-sm' };
    return `${base} ${sizes[this.size()]}`;
  });
}