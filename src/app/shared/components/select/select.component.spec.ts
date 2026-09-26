import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AppSelectComponent } from "./select.component";

describe("AppSelectComponent", () => {
  let fixture: ComponentFixture<AppSelectComponent>;
  let component: AppSelectComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppSelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AppSelectComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("id", "status-select");
    fixture.componentRef.setInput("options", ["New", "Review", "Design"]);
    fixture.componentRef.setInput("placeholder", "Choose status");
    fixture.detectChanges();
  });

  it("renders the placeholder and options", () => {
    const select = fixture.nativeElement.querySelector(
      "select",
    ) as HTMLSelectElement;
    const options = Array.from(select.querySelectorAll("option")).map(
      (option) => option.textContent?.trim(),
    );

    expect(options).toEqual(["Choose status", "New", "Review", "Design"]);
  });

  it("updates the model when the selection changes", () => {
    const select = fixture.nativeElement.querySelector(
      "select",
    ) as HTMLSelectElement;
    select.value = "Review";
    select.dispatchEvent(new Event("change"));
    fixture.detectChanges();

    expect(component.value()).toBe("Review");
  });

  it("applies disabled state to the native select", () => {
    fixture.componentRef.setInput("disabled", true);
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector(
      "select",
    ) as HTMLSelectElement;
    expect(select.disabled).toBeTrue();
  });

  it("renders object options with explicit labels", () => {
    fixture.componentRef.setInput("options", [
      { label: "Active", value: "active" },
      { label: "Closed", value: "closed" },
    ]);
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector(
      "select",
    ) as HTMLSelectElement;
    const options = Array.from(select.querySelectorAll("option")).map(
      (option) => option.textContent?.trim(),
    );

    expect(options).toEqual(["Choose status", "Active", "Closed"]);
  });

  it("applies ControlValueAccessor disabled state from forms", () => {
    component.setDisabledState(true);
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector(
      "select",
    ) as HTMLSelectElement;
    expect(select.disabled).toBeTrue();
  });
});
