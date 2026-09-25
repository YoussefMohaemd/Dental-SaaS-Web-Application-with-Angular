import { CommonModule } from "@angular/common";
import { Component, input } from "@angular/core";

export interface WorkflowTimelineStage {
  label: string;
  status: string;
  owner: string;
  description: string;
  actions: readonly string[];
}

@Component({
  selector: "app-workflow-timeline",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./workflow-timeline.component.html",
  styleUrl: "./workflow-timeline.component.scss",
})
export class WorkflowTimelineComponent {
  readonly stages = input<readonly WorkflowTimelineStage[]>([]);
  readonly currentIndex = input<number>(0);
  readonly completedCount = input<number>(0);
  readonly currentUpdatedAt = input<string>("");
}
