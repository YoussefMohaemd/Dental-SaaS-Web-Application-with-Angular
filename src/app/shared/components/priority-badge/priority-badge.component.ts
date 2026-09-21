import { Component, input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormatUtils } from '../../../core/services/format-utils.service';

@Component({
  selector: 'app-priority-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './priority-badge.component.html',
  styleUrl: './priority-badge.component.scss'
})
export class PriorityBadgeComponent {
  readonly priority = input.required<string>();

  private readonly formatUtils = inject(FormatUtils);

  readonly dotClass = computed(() => this.formatUtils.getPriorityDotClass(this.priority()));
  // React parity (OrdersPage PriorityBadge): Low slate / Normal blue / High amber / Urgent red.
  readonly colorClass = computed(() => {
    const colors: Record<string, string> = {
      Low: 'text-slate-400',
      Normal: 'text-blue-500',
      High: 'text-amber-500',
      Urgent: 'text-red-500',
    };
    return colors[this.priority()] ?? 'text-slate-400';
  });
}