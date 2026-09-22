import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Priority -> dot colors. Kept local so this presentational component never
 *  depends on injectable services (React parity: PriorityBadge is pure UI). */
const DOT_CLASSES: Record<string, string> = {
  Low: 'bg-slate-400',
  Normal: 'bg-blue-500',
  High: 'bg-amber-500',
  Urgent: 'bg-red-500'
};

@Component({
  selector: 'app-priority-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './priority-badge.component.html',
  styleUrl: './priority-badge.component.scss'
})
export class PriorityBadgeComponent {
  readonly priority = input.required<string>();

  readonly dotClass = computed(() => DOT_CLASSES[this.priority()] ?? 'bg-slate-400');
}