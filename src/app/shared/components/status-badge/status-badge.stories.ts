import type { Meta, StoryObj } from "@storybook/angular-vite";
import { StatusBadgeComponent } from "./status-badge.component";

const meta: Meta<StatusBadgeComponent> = {
  title: "Basic/StatusBadge",
  component: StatusBadgeComponent,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    status: {
      control: "text",
      description:
        "Raw status key; drives color mapping and default display label.",
    },
    label: {
      control: "text",
      description: "Optional display label override.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md"],
      description: "Size scale of the badge.",
    },
  },
  args: {
    status: "New",
    label: "",
    size: "xs",
  },
};

export default meta;
type Story = StoryObj<StatusBadgeComponent>;

export const Default: Story = {};

export const Completed: Story = {
  args: { status: "Completed" },
};

export const InProgress: Story = {
  args: { status: "In Progress" },
};

export const Cancelled: Story = {
  args: { status: "Cancelled" },
};

export const CustomLabel: Story = {
  args: { status: "Completed", label: "Delivered to clinic" },
};

export const AllStatuses: Story = {
  render: () => ({
    props: {},
    template: `
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; max-width: 480px;">
        @for (status of ['New', 'Review', 'Design', 'Production', 'Quality Check', 'Ready', 'Completed', 'Cancelled', 'Paid', 'Overdue', 'Invoiced', 'Pending']; track status) {
          <app-status-badge [status]="status" size="sm" />
        }
      </div>
    `,
  }),
};
