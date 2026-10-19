import { WorkflowTimelineStage } from '@core/interfaces';
import { CommonModule } from "@angular/common";
import { Component, input } from "@angular/core";

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
