import type { Meta, StoryObj } from "@storybook/angular-vite";
import { OrderSummaryCardComponent } from "./order-summary-card.component";
import type { Order } from "@core/models";

const MOCK_ORDER: Order = {
  id: "ord-024042",
  orderNumber: "DL-024042",
  patientId: "pat-1001",
  patientName: "Mona El-Sayed",
  doctorId: "doc-2001",
  doctorName: "Dr. Karim Hassan",
  clinicId: "cln-3001",
  clinicName: "Downtown Dental Clinic",
  scanCenterId: "scan-4001",
  scanCenterName: "Nile Scan Center",
  status: "Production",
  priority: "High",
  restoration: "Veneer",
  arch: "Maxilla",
  format: "STL",
  shade: "A2",
  units: 6,
  amount: 4800,
  billed: true,
  billedAmount: 4800,
  billTo: "Clinic account",
  vouchers: 0,
  isLocked: false,
  hasNotes: true,
  notes: "Shade reference attached.",
  receivedAt: "2026-09-24T08:15:00Z",
  updatedAt: "2026-09-25T11:30:00Z",
  dueDate: "2026-09-29",
  sentAt: "2026-09-24T10:45:00Z",
  chargedAt: "2026-09-25T12:00:00Z",
};

const meta: Meta<OrderSummaryCardComponent> = {
  title: "Business/OrderSummaryCard",
  component: OrderSummaryCardComponent,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    completedServices: {
      control: { type: "number", min: 0, max: 12, step: 1 },
      description: "Completed service count shown in the summary line.",
    },
    totalServices: {
      control: { type: "number", min: 0, max: 12, step: 1 },
      description: "Total services for the order.",
    },
  },
  args: {
    order: MOCK_ORDER,
    completedServices: 3,
    totalServices: 5,
  },
};

export default meta;
type Story = StoryObj<OrderSummaryCardComponent>;

export const Default: Story = {};

export const FinishedOrder: Story = {
  args: {
    completedServices: 5,
    totalServices: 5,
  },
};

export const MinimalProgress: Story = {
  args: {
    completedServices: 0,
    totalServices: 5,
  },
};
