import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './error-state.component.html',
  styleUrl: './error-state.component.scss'
})
export class ErrorStateComponent {
  readonly title = input<string>('Failed to load data');
  readonly description = input<string>('An error occurred while loading the data.');
  readonly retryLabel = input<string>('Try Again');
  readonly height = input<string>('256px');

  readonly retryClick = output<void>();
}