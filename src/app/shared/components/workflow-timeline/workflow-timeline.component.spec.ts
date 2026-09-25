import { ComponentFixture, TestBed } from "@angular/core/testing";
import { WorkflowTimelineComponent } from "./workflow-timeline.component";

describe("WorkflowTimelineComponent", () => {
  let fixture: ComponentFixture<WorkflowTimelineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkflowTimelineComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkflowTimelineComponent);
    fixture.componentRef.setInput("stages", [
      {
        label: "Received",
        status: "done",
        owner: "Lab",
        description: "Queued",
        actions: [],
      },
      {
        label: "Design",
        status: "active",
        owner: "Design",
        description: "Working",
        actions: ["Review"],
      },
    ]);
    fixture.componentRef.setInput("currentIndex", 1);
    fixture.componentRef.setInput("completedCount", 1);
    fixture.componentRef.setInput("currentUpdatedAt", "2026-09-22");
    fixture.detectChanges();
  });

  it("renders the timeline summary", () => {
    expect(fixture.nativeElement.textContent).toContain(
      "1 of 2 stages complete",
    );
  });
});
