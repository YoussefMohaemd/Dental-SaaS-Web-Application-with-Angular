import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { CdkTrapFocus } from "@angular/cdk/a11y";
import { EntityDialogComponent } from "./entity-dialog.component";

@Component({
  standalone: true,
  imports: [EntityDialogComponent],
  template: `
    <app-entity-dialog
      title="Delete order"
      subtitle="This action cannot be undone"
      [visible]="visible"
      [showFooter]="footer"
      (visibleChange)="visible = $event"
      (closed)="closed = closed + 1"
    >
      <p>Order body</p>
      <button type="button" dialog-actions>Delete</button>
    </app-entity-dialog>
  `,
})
class DialogHostComponent {
  visible = true;
  footer = true;
  closed = 0;
}

async function renderVisibleDialog<T>(
  fixture: ComponentFixture<T>,
): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

describe("EntityDialogComponent", () => {
  let component: EntityDialogComponent;
  let fixture: ComponentFixture<EntityDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityDialogComponent, DialogHostComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityDialogComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("title", "Delete order");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should expose documented defaults for optional configuration", () => {
    expect(component.width()).toBe("32rem");
    expect(component.dismissableMask()).toBe(true);
    expect(component.showFooter()).toBe(true);
    expect(component.subtitle()).toBe("");
  });

  it("should emit visibleChange when the dialog visibility changes", () => {
    spyOn(component.visibleChange, "emit");
    component.onDialogVisibleChange(true);
    expect(component.visibleChange.emit).toHaveBeenCalledWith(true);
  });

  it("should emit visibleChange(false) and closed on hide", () => {
    spyOn(component.visibleChange, "emit");
    spyOn(component.closed, "emit");
    component.onDialogHide();
    expect(component.visibleChange.emit).toHaveBeenCalledWith(false);
    expect(component.closed.emit).toHaveBeenCalled();
  });

  it("should delegate PrimeNG hide events to the public outputs", async () => {
    fixture.componentRef.setInput("visible", true);
    await renderVisibleDialog(fixture);

    const dialog = fixture.debugElement.query(By.css("p-dialog"));
    expect(dialog).toBeTruthy();

    spyOn(component.visibleChange, "emit");
    spyOn(component.closed, "emit");
    dialog.triggerEventHandler("onHide", null);

    expect(component.visibleChange.emit).toHaveBeenCalledWith(false);
    expect(component.closed.emit).toHaveBeenCalled();
  });

  it("should render the dialog title and subtitle when visible", async () => {
    fixture.componentRef.setInput("subtitle", "This cannot be undone");
    fixture.componentRef.setInput("visible", true);
    await renderVisibleDialog(fixture);

    const heading = fixture.debugElement.query(By.css("h2"));
    expect(heading).toBeTruthy();
    expect(heading.nativeElement.textContent).toContain("Delete order");
    const subtitle = fixture.debugElement.query(
      By.css(".app-entity-dialog p, h2 + p"),
    );
    expect(subtitle.nativeElement.textContent).toContain(
      "This cannot be undone",
    );
  });

  it("should not render dialog content while hidden", () => {
    fixture.componentRef.setInput("visible", false);
    fixture.detectChanges();
    const heading = fixture.debugElement.query(By.css("h2"));
    expect(heading).toBeNull();
  });

  it("should trap focus inside dialog content while visible", async () => {
    fixture.componentRef.setInput("visible", true);
    await renderVisibleDialog(fixture);
    const trap = fixture.debugElement.query(By.directive(CdkTrapFocus));
    expect(trap).toBeTruthy();
  });

  it("should render projected footer actions when the footer is shown", async () => {
    const hostFixture = TestBed.createComponent(DialogHostComponent);
    await renderVisibleDialog(hostFixture);
    const action = hostFixture.debugElement.query(By.css("[dialog-actions]"));
    expect(action).toBeTruthy();
    expect(action.nativeElement.textContent).toContain("Delete");
  });

  it("should keep the projected body content available while visible", async () => {
    const hostFixture = TestBed.createComponent(DialogHostComponent);
    await renderVisibleDialog(hostFixture);
    const paragraphs = hostFixture.debugElement.queryAll(By.css("p"));
    const body = paragraphs.find((p) =>
      p.nativeElement.textContent.includes("Order body"),
    );
    expect(body).toBeTruthy();
  });

  it("should suppress the footer when showFooter is false", async () => {
    const hostFixture = TestBed.createComponent(DialogHostComponent);
    hostFixture.componentInstance.footer = false;
    await renderVisibleDialog(hostFixture);
    const action = hostFixture.debugElement.query(By.css("[dialog-actions]"));
    expect(action).toBeNull();
  });

  it("should wire visibility and close events through a host page", async () => {
    const hostFixture = TestBed.createComponent(DialogHostComponent);
    await renderVisibleDialog(hostFixture);
    const host = hostFixture.componentInstance;

    const heading = hostFixture.debugElement.query(By.css("h2"));
    expect(heading.nativeElement.textContent).toContain("Delete order");

    const dialog = hostFixture.debugElement.query(By.css("p-dialog"));
    dialog.triggerEventHandler("onHide", null);
    hostFixture.detectChanges();

    expect(host.visible).toBe(false);
    expect(host.closed).toBe(1);
  });
});
