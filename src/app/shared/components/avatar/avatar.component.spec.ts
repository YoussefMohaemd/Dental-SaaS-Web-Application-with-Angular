import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { AvatarComponent } from "./avatar.component";

describe("AvatarComponent", () => {
  let component: AvatarComponent;
  let fixture: ComponentFixture<AvatarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvatarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AvatarComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("name", "Test User");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display initials from name", () => {
    fixture.componentRef.setInput("name", "John Doe");
    fixture.detectChanges();
    const avatar = fixture.debugElement.query(By.css("span"));
    expect(avatar.nativeElement.textContent.trim()).toBe("JD");
  });

  it("should apply size classes", () => {
    fixture.componentRef.setInput("size", "lg");
    fixture.detectChanges();
    const avatar = fixture.debugElement.query(By.css("div"));
    expect(avatar.nativeElement).toHaveClass("w-10");
    expect(avatar.nativeElement).toHaveClass("h-10");
  });

  it("should apply variant classes", () => {
    fixture.componentRef.setInput("variant", "success");
    fixture.detectChanges();
    const avatar = fixture.debugElement.query(By.css("div"));
    expect(avatar.nativeElement).toHaveClass("bg-success/10");
    expect(avatar.nativeElement).toHaveClass("text-success");
  });

  it("should display image when provided", () => {
    const dataUri =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    fixture.componentRef.setInput("name", "John Doe");
    fixture.componentRef.setInput("image", dataUri);
    fixture.detectChanges();
    const img = fixture.debugElement.query(By.css("img"));
    expect(img).toBeTruthy();
    expect(img.nativeElement.src).toContain("data:image/gif");
  });

  it("should truncate initials to 2 characters", () => {
    fixture.componentRef.setInput("name", "John Michael Doe");
    fixture.detectChanges();
    const avatar = fixture.debugElement.query(By.css("span"));
    expect(avatar.nativeElement.textContent.trim()).toBe("JM");
  });
});
