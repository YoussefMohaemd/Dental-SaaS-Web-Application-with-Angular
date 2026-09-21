export type SubOrderStatus = 'completed' | 'in-progress' | 'pending' | 'blocked';

export interface SubOrder {
  id: string;
  service: string;
  icon: string;
  status: SubOrderStatus;
  formsComplete: number;
  formsTotal: number;
  scansComplete: number;
  scansTotal: number;
  teeth: number[];
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  dueDate: string;
  notes: string;
}

export interface OrderWorkflowStage {
  name: string;
  completed: boolean;
  active: boolean;
}