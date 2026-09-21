import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-state.component.html',
  styleUrl: './loading-state.component.scss'
})
export class LoadingStateComponent {
  readonly type = input<'spinner' | 'bars' | 'skeleton'>('spinner');
  readonly height = input<string>('200px');
  readonly skeletonClass = input<string>('skeleton h-10 rounded-lg');
  readonly bars = [
    { delay: '0ms' },
    { delay: '100ms' },
    { delay: '200ms' },
    { delay: '300ms' }
  ];
}