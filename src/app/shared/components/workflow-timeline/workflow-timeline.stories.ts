import type { Meta, StoryObj } from '@storybook/angular-vite';
import {
  WorkflowTimelineComponent,
  WorkflowTimelineStage,
} from './workflow-timeline.component';

const STAGES: WorkflowTimelineStage[] = [
  {
    status: 'New',
    label: 'Order Received',
    owner: 'Reception',
    description: 'Order intake and initial verification.',
    actions: ['Verify scan files', 'Confirm patient details', 'Set priority'],
  },
  {
    status: 'Review',
    label: 'Technical Review',
    owner: 'Lead Technician',
    description: 'Validate scan quality and prescription.',
    actions: ['Review STL quality', 'Validate occlusal data'],
  },
  {
    status: 'Design',
    label: 'CAD Design',
    owner: 'T. Anderson',
    description: 'Digital design and margin placement.',
    actions: ['Create initial design', 'Margin placement'],
  },
  {
    status: 'Production',
    label: 'Milling / Fabrication',
    owner: 'M. Rivera',
    description: 'Manufacturing and post-processing.',
    actions: ['Queue milling job', 'Monitor production'],
  },
  {
    status: 'Quality Check',
    label: 'Quality Control',
    owner: 'QC Team',
    description: 'Final inspection before dispatch.',
    actions: ['Occlusal check', 'Shade verification'],
  },
  {
    status: 'Ready',
    label: 'Ready for Pickup',
    owner: 'Dispatch',
    description: 'Packaging and clinic notification.',
    actions: ['Package order', 'Notify clinic'],
  },
  {
    status: 'Completed',
    label: 'Delivered',
    owner: 'Completed',
    description: 'Order delivered and closed.',
    actions: [],
  },
];

const meta: Meta<WorkflowTimelineComponent> = {
  title: 'Business/WorkflowTimeline',
  component: WorkflowTimelineComponent,
  tags: ['autodocs'],
  argTypes: {
    stages: {
      control: 'object',
      description: 'Ordered workflow stages rendered by the timeline.',
    },
    currentIndex: {
      control: { type: 'range', min: 0, max: 6, step: 1 },
      description:
        'Index of the active stage; earlier stages render as complete.',
    },
    completedCount: {
      control: { type: 'range', min: 0, max: 7, step: 1 },
      description: 'Completed stages shown in the summary.',
    },
    currentUpdatedAt: {
      control: 'text',
      description: 'Optional last-updated timestamp for the summary.',
    },
  },
  args: {
    stages: STAGES,
    currentIndex: 2,
    completedCount: 2,
    currentUpdatedAt: 'Today, 14:32',
  },
};

export default meta;
type Story = StoryObj<WorkflowTimelineComponent>;

export const InProgress: Story = {};

export const EarlyStage: Story = {
  args: {
    currentIndex: 0,
    completedCount: 0,
    currentUpdatedAt: 'Today, 09:05',
  },
};

export const FinalStage: Story = {
  args: {
    currentIndex: 6,
    completedCount: 6,
    currentUpdatedAt: 'Yesterday, 17:48',
  },
};

export const WithoutTimestamp: Story = {
  args: {
    currentIndex: 4,
    completedCount: 4,
    currentUpdatedAt: '',
  },
};
