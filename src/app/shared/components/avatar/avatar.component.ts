import { Component, input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormatUtils } from '../../../core/services/format-utils.service';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarVariant = 'primary' | 'success' | 'warning' | 'accent' | 'violet';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss'
})
export class AvatarComponent {
  readonly name = input.required<string>();
  readonly image = input<string | null>(null);
  readonly size = input<AvatarSize>('md');
  readonly variant = input<AvatarVariant>('primary');

  private readonly formatUtils = inject(FormatUtils);

  readonly initials = computed(() => this.formatUtils.getInitials(this.name()));

  readonly avatarClasses = computed(() => {
    const base = 'inline-flex items-center justify-center rounded-full font-bold shrink-0';
    const variants: Record<AvatarVariant, string> = {
      primary: 'bg-primary/10 text-primary',
      success: 'bg-success/10 text-success',
      warning: 'bg-warning/10 text-warning',
      accent: 'bg-accent/10 text-accent',
      violet: 'bg-violet/10 text-violet'
    };
    const sizes: Record<AvatarSize, string> = {
      xs: 'w-6 h-6 text-xs',
      sm: 'w-7 h-7 text-xs',
      md: 'w-8 h-8 text-sm',
      lg: 'w-10 h-10 text-base',
      xl: 'w-12 h-12 text-lg'
    };
    return `${base} ${variants[this.variant()]} ${sizes[this.size()]}`;
  });
}