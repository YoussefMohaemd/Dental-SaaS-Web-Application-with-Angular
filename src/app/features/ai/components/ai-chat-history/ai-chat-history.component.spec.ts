import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { AiChatHistoryComponent } from "./ai-chat-history.component";

describe("AiChatHistoryComponent", () => {
  let component: AiChatHistoryComponent;
  let fixture: ComponentFixture<AiChatHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiChatHistoryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AiChatHistoryComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("open", true);
    fixture.componentRef.setInput("conversations", [
      {
        id: "conv-1",
        title: "Chat one",
        updatedAt: new Date().toISOString(),
        preview: "Preview text",
        isActive: true,
      },
    ]);
    fixture.detectChanges();
  });

  it("should render conversation list item", () => {
    expect(fixture.debugElement.query(By.css(".history-item"))).toBeTruthy();
  });

  it("should emit conversation selection", () => {
    spyOn(component.conversationSelected, "emit");
    const item = fixture.debugElement.query(By.css(".history-item"));
    item.triggerEventHandler("click", new MouseEvent("click"));
    expect(component.conversationSelected.emit).toHaveBeenCalledWith("conv-1");
  });
});
