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

  it("renders the stage list", () => {
    const stageTitles = Array.from(
      fixture.nativeElement.querySelectorAll(
        "ol li p.text-sm",
      ) as NodeListOf<HTMLElement>,
    ).map((element) => element.textContent?.trim());

    expect(stageTitles).toEqual(["Received", "Design"]);
  });

  it("marks only the active stage with aria-current step", () => {
    const stages = Array.from(
      fixture.nativeElement.querySelectorAll(
        "ol li",
      ) as NodeListOf<HTMLElement>,
    );
    const marked = stages.filter(
      (element) => element.getAttribute("aria-current") === "step",
    );

    expect(marked.length).toBe(1);
    expect(marked[0].textContent).toContain("Design");
  });

  it("renders an empty-state summary when no stages are provided", () => {
    fixture.componentRef.setInput("stages", []);
    fixture.componentRef.setInput("completedCount", 0);
    fixture.componentRef.setInput("currentIndex", 0);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      "0 of 0 stages complete",
    );
  });
});
