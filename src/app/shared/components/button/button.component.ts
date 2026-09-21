import { Component, input, output, computed, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss'
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly routerLink = input<string | string[] | null>(null);

  readonly onClick = output<MouseEvent>();

  readonly buttonClasses = computed(() => {
    const base = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants: Record<ButtonVariant, string> = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary',
      outline: 'border border-border bg-transparent hover:bg-muted active:bg-muted',
      ghost: 'bg-transparent hover:bg-muted active:bg-muted',
      danger: 'bg-danger text-danger-foreground hover:bg-danger/90 active:bg-danger',
      success: 'bg-success text-success-foreground hover:bg-success/90 active:bg-success'
    };

    const sizes: Record<ButtonSize, string> = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
      icon: 'p-2',
      'icon-sm': 'p-1.5'
    };

    return `${base} ${variants[this.variant()]} ${sizes[this.size()]}`;
  });

  readonly isLink = computed(() => !!this.routerLink());
}