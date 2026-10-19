export interface VolumeDay {
  day: string;
  orders: number;
  completed: number;
}

export interface VolumeWeek {
  weekStart: string;
  weekLabel: string;
  days: VolumeDay[];
}

