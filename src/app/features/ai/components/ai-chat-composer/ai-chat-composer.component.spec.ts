import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { AiChatComposerComponent } from "./ai-chat-composer.component";

describe("AiChatComposerComponent", () => {
  let component: AiChatComposerComponent;
  let fixture: ComponentFixture<AiChatComposerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiChatComposerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AiChatComposerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("draft", "");
    fixture.componentRef.setInput("canSend", true);
    fixture.componentRef.setInput("loading", false);
    fixture.detectChanges();
  });

  it("should emit submit on Enter", () => {
    spyOn(component.submitted, "emit");
    const textarea = fixture.debugElement.query(By.css("#ai-prompt"))
      .nativeElement as HTMLTextAreaElement;
    textarea.value = "Show services";
    textarea.dispatchEvent(new Event("input"));
    fixture.detectChanges();

    textarea.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", shiftKey: false }),
    );

    expect(component.submitted.emit).toHaveBeenCalledWith("Show services");
  });

  it("should not emit submit on Shift+Enter", () => {
    spyOn(component.submitted, "emit");
    const textarea = fixture.debugElement.query(By.css("#ai-prompt"))
      .nativeElement as HTMLTextAreaElement;
    textarea.value = "Line 1";
    textarea.dispatchEvent(new Event("input"));
    fixture.detectChanges();

    textarea.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", shiftKey: true }),
    );

    expect(component.submitted.emit).not.toHaveBeenCalled();
  });
});
