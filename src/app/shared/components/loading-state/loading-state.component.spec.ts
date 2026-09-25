import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { LoadingStateComponent } from "./loading-state.component";

describe("LoadingStateComponent", () => {
  let component: LoadingStateComponent;
  let fixture: ComponentFixture<LoadingStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingStateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render spinner by default", () => {
    const spinner = fixture.debugElement.query(By.css(".loading-spinner"));
    expect(spinner).toBeTruthy();
  });

  it("should render bars when type is bars", () => {
    fixture.componentRef.setInput("type", "bars");
    fixture.detectChanges();
    const bars = fixture.debugElement.queryAll(By.css(".flex.gap-1 > div"));
    expect(bars.length).toBe(4);
  });

  it("should render skeleton when type is skeleton", () => {
    fixture.componentRef.setInput("type", "skeleton");
    fixture.detectChanges();
    const skeleton = fixture.debugElement.query(By.css(".skeleton"));
    expect(skeleton).toBeTruthy();
  });

  it("should apply custom height", () => {
    fixture.componentRef.setInput("height", "300px");
    fixture.detectChanges();
    const container = fixture.debugElement.query(By.css("div.flex"));
    expect(container.nativeElement.style.height).toBe("300px");
  });

  it("should apply custom skeleton class", () => {
    fixture.componentRef.setInput("type", "skeleton");
    fixture.componentRef.setInput("skeletonClass", "custom-skeleton-class");
    fixture.detectChanges();
    const skeleton = fixture.debugElement.query(
      By.css(".custom-skeleton-class"),
    );
    expect(skeleton).toBeTruthy();
  });
});
