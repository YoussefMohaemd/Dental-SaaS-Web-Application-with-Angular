import type { Meta, StoryObj } from '@storybook/angular-vite';
import { SearchFilterToolbarComponent } from './search-filter-toolbar.component';

const meta: Meta<SearchFilterToolbarComponent> = {
  title: 'Composite/SearchFilterToolbar',
  component: SearchFilterToolbarComponent,
  tags: ['autodocs'],
  argTypes: {
    searchId: {
      control: 'text',
      description: 'Required id for the search field (label association).',
    },
    selectId: {
      control: 'text',
      description: 'Required id for the filter select.',
    },
    actionLabel: {
      control: 'text',
      description: 'Primary action label (hidden below sm breakpoint).',
    },
    actionAriaLabel: {
      control: 'text',
      description: 'Accessible name for the primary action button.',
    },
    actionDisabled: {
      control: 'boolean',
      description: 'Disables the primary action.',
    },
    searchPlaceholder: { control: 'text' },
    searchValue: { control: 'text' },
    selectPlaceholder: { control: 'text' },
    selectValue: {
      control: 'select',
      options: ['', 'Active', 'Completed', 'Pending'],
    },
    selectOptions: {
      control: 'object',
      description: 'Options for the status filter select.',
    },
    searchValueChange: {
      action: 'searchValueChange',
      table: { category: 'Outputs' },
    },
    selectValueChange: {
      action: 'selectValueChange',
      table: { category: 'Outputs' },
    },
    actionClick: { action: 'actionClick', table: { category: 'Outputs' } },
  },
  args: {
    searchId: 'toolbar-search',
    selectId: 'toolbar-status',
    actionLabel: 'New Order',
    actionAriaLabel: 'Create order',
    actionDisabled: false,
    searchPlaceholder: 'Search by order or patient...',
    searchValue: '',
    selectPlaceholder: 'All statuses',
    selectValue: '',
    selectOptions: ['Active', 'Completed', 'Pending'],
  },
};

export default meta;
type Story = StoryObj<SearchFilterToolbarComponent>;

export const Default: Story = {};

export const WithActiveFilter: Story = {
  args: {
    searchValue: 'ORD-1042',
    selectValue: 'Active',
    searchPlaceholder: 'Search orders...',
  },
};

export const DisabledAction: Story = {
  args: {
    actionDisabled: true,
    actionAriaLabel: 'Create order (unavailable)',
  },
};

export const ResponsiveCollapsingAction: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Below the sm breakpoint the action label is visually hidden and the button relies on its aria-label — verify accessible naming on mobile widths.',
      },
    },
  },
  args: {
    actionLabel: 'Create Order',
    actionAriaLabel: 'Create order',
  },
};
