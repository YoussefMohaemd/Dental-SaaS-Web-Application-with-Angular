import type { Meta, StoryObj } from "@storybook/angular-vite";
import { AppSelectComponent } from "./select.component";

const meta: Meta<AppSelectComponent> = {
  title: "Basic/AppSelect",
  component: AppSelectComponent,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    id: {
      control: "text",
      description: "Stable id for label association.",
    },
    label: {
      control: "text",
      description: "Visible label rendered above the select.",
    },
    placeholder: {
      control: "text",
      description: "Placeholder option shown when no value is selected.",
    },
    options: {
      control: "object",
      description: "Array of option labels or label/value pairs.",
    },
    value: { control: "text", description: "Bindable current value." },
    disabled: { control: "boolean", description: "Disables the select." },
    required: { control: "boolean", description: "Marks the select required." },
    ariaLabel: {
      control: "text",
      description: "Accessible name when no visible label is present.",
    },
  },
  args: {
    id: "status-select",
    label: "Status",
    placeholder: "All statuses",
    options: ["Active", "Completed", "Pending"],
    value: "",
    disabled: false,
    required: false,
    ariaLabel: "",
  },
};

export default meta;
type Story = StoryObj<AppSelectComponent>;

export const Default: Story = {};

export const WithObjectOptions: Story = {
  args: {
    options: [
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive" },
      { label: "Pending review", value: "pending" },
    ],
  },
};

export const Disabled: Story = {
  args: {
    value: "Completed",
    disabled: true,
  },
};

export const WithoutVisibleLabel: Story = {
  args: {
    label: "",
    ariaLabel: "Order status filter",
    placeholder: "All statuses",
  },
};
