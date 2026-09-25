import type { Meta, StoryObj } from '@storybook/angular-vite';
import { InputComponent } from './input.component';

const meta: Meta<InputComponent> = {
  title: 'Basic/AppTextField',
  component: InputComponent,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    label: { control: 'text', description: 'Visible field label.' },
    placeholder: { control: 'text', description: 'Placeholder text.' },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'tel', 'number', 'date', 'search'],
      description: 'Native input type.',
    },
    hint: {
      control: 'text',
      description: 'Helper text rendered below the field.',
    },
    error: {
      control: 'text',
      description: 'Validation message; sets aria-invalid.',
    },
    required: { control: 'boolean', description: 'Marks the field required.' },
    disabled: { control: 'boolean', description: 'Disables the field.' },
    readOnly: { control: 'boolean', description: 'Makes the field read-only.' },
    ariaLabel: {
      control: 'text',
      description: 'Accessible name when no visible label is used.',
    },
    value: { control: 'text', description: 'Two-way bindable value.' },
  },
  args: {
    label: '',
    placeholder: 'Enter text...',
    type: 'text',
    hint: '',
    error: '',
    required: false,
    disabled: false,
    readOnly: false,
    ariaLabel: '',
    value: '',
  },
};

export default meta;
type Story = StoryObj<InputComponent>;

export const Default: Story = {};

export const WithLabel: Story = {
  args: {
    label: 'Patient name',
    placeholder: 'Search patients...',
    value: '',
  },
};

export const WithHint: Story = {
  args: {
    label: 'Email',
    placeholder: 'name@clinic.com',
    hint: 'We never share your email.',
    type: 'email',
  },
};

export const WithValidationError: Story = {
  args: {
    label: 'Order reference',
    placeholder: 'ORD-0000',
    required: true,
    error: 'Order reference is required.',
    value: '',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Order reference',
    value: 'ORD-1042',
    disabled: true,
  },
};

export const ReadOnly: Story = {
  args: {
    label: 'Order reference',
    value: 'ORD-1042',
    readOnly: true,
  },
};

export const SearchWithoutLabel: Story = {
  args: {
    type: 'search',
    ariaLabel: 'Search orders',
    placeholder: 'Search by order or patient...',
  },
};
