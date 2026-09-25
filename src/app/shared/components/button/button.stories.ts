import type { Meta, StoryObj } from '@storybook/angular-vite';
import { ButtonComponent } from './button.component';

const meta: Meta<ButtonComponent> = {
  title: 'Basic/AppButton',
  component: ButtonComponent,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger', 'success'],
      description: 'Visual variant of the button.',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'icon', 'icon-sm'],
      description: 'Size scale of the button.',
    },
    type: {
      control: 'select',
      options: ['button', 'submit', 'reset'],
      description: 'Native button type.',
    },
    disabled: { control: 'boolean', description: 'Disables interaction.' },
    loading: {
      control: 'boolean',
      description: 'Shows a spinner and sets aria-busy.',
    },
    ariaLabel: {
      control: 'text',
      description: 'Accessible name (required for icon-only buttons).',
    },
    title: { control: 'text', description: 'Native tooltip title.' },
    onClick: { action: 'onClick', table: { category: 'Outputs' } },
  },
  args: {
    variant: 'primary',
    size: 'md',
    type: 'button',
    disabled: false,
    loading: false,
    ariaLabel: '',
    title: '',
  },
};

export default meta;
type Story = StoryObj<ButtonComponent>;

export const Primary: Story = {
  render: (args) => ({
    props: args,
    template: `<app-button [variant]="variant" [size]="size" [disabled]="disabled" [loading]="loading" [ariaLabel]="ariaLabel">Save changes</app-button>`,
  }),
};

export const Secondary: Story = {
  render: (args) => ({
    props: args,
    template: `<app-button variant="secondary">Cancel</app-button>`,
  }),
};

export const Danger: Story = {
  render: (args) => ({
    props: args,
    template: `<app-button variant="danger">Delete order</app-button>`,
  }),
};

export const Disabled: Story = {
  render: (args) => ({
    props: args,
    template: `<app-button variant="primary" [disabled]="true">Disabled</app-button>`,
  }),
};

export const Loading: Story = {
  render: (args) => ({
    props: args,
    template: `<app-button variant="primary" [loading]="true">Saving</app-button>`,
  }),
};

export const AllVariants: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;">
        <app-button variant="primary">Primary</app-button>
        <app-button variant="secondary">Secondary</app-button>
        <app-button variant="outline">Outline</app-button>
        <app-button variant="ghost">Ghost</app-button>
        <app-button variant="danger">Danger</app-button>
        <app-button variant="success">Success</app-button>
      </div>
    `,
  }),
};

export const AllSizes: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;">
        <app-button size="sm">Small</app-button>
        <app-button size="md">Medium</app-button>
        <app-button size="lg">Large</app-button>
      </div>
    `,
  }),
};
