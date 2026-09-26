import type { Meta, StoryObj } from '@storybook/angular-vite';
import { DataTableToolbarComponent } from './data-table-toolbar.component';

const meta: Meta<DataTableToolbarComponent> = {
  title: 'Composite/DataTableToolbar',
  component: DataTableToolbarComponent,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    title: {
      control: 'text',
      description: 'Main title shown in the page header.',
    },
    subtitle: {
      control: 'text',
      description: 'Optional supporting description.',
    },
  },
  args: {
    title: 'Orders',
    subtitle: '126 active records',
  },
};

export default meta;
type Story = StoryObj<DataTableToolbarComponent>;

export const Default: Story = {};

export const WithActions: Story = {
  render: (args) => ({
    props: args,
    template: `
      <app-data-table-toolbar [title]="title" [subtitle]="subtitle">
        <button
          header-actions
          type="button"
          class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Export CSV
        </button>
      </app-data-table-toolbar>
    `,
  }),
};

export const WithoutSubtitle: Story = {
  args: {
    subtitle: '',
  },
};
