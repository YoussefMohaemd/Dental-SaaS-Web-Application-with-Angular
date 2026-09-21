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
  readonly colorClass = computed(() => 'text-' + this.priority().toLowerCase() + '-500');
}