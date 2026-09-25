import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { SearchInputComponent } from "./search-input.component";

describe("SearchInputComponent", () => {
  let component: SearchInputComponent;
  let fixture: ComponentFixture<SearchInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render with default placeholder", () => {
    const input = fixture.debugElement.query(By.css("input"));
    expect(input.nativeElement.placeholder).toBe("Search...");
  });

  it("should render custom placeholder", () => {
    fixture.componentRef.setInput("placeholder", "Search orders...");
    fixture.detectChanges();
    const input = fixture.debugElement.query(By.css("input"));
    expect(input.nativeElement.placeholder).toBe("Search orders...");
  });

  it("should bind value to input", () => {
    fixture.componentRef.setInput("value", "test query");
    fixture.detectChanges();
    const input = fixture.debugElement.query(By.css("input"));
    expect(input.nativeElement.value).toBe("test query");
  });

  it("should emit search event on input", () => {
    spyOn(component.onSearch, "emit");
    const input = fixture.debugElement.query(By.css("input"));
    input.nativeElement.value = "search term";
    input.triggerEventHandler("input", { target: input.nativeElement });
    expect(component.onSearch.emit).toHaveBeenCalledWith("search term");
  });

  it("should show clear button when value exists and clearable is true", () => {
    fixture.componentRef.setInput("value", "search term");
    fixture.detectChanges();
    const clearBtn = fixture.debugElement.query(By.css("button"));
    expect(clearBtn).toBeTruthy();
  });

  it("should not show clear button when value is empty", () => {
    fixture.componentRef.setInput("value", "");
    fixture.detectChanges();
    const clearBtn = fixture.debugElement.query(By.css("button"));
    expect(clearBtn).toBeFalsy();
  });

  it("should not show clear button when clearable is false", () => {
    fixture.componentRef.setInput("value", "search term");
    fixture.componentRef.setInput("clearable", false);
    fixture.detectChanges();
    const clearBtn = fixture.debugElement.query(By.css("button"));
    expect(clearBtn).toBeFalsy();
  });

  it("should clear value when clear button clicked", () => {
    fixture.componentRef.setInput("value", "search term");
    fixture.detectChanges();
    const clearBtn = fixture.debugElement.query(By.css("button"));
    clearBtn.triggerEventHandler("click", new MouseEvent("click"));
    expect(component.value()).toBe("");
  });

  it("should emit empty string on clear", () => {
    spyOn(component.onSearch, "emit");
    fixture.componentRef.setInput("value", "search term");
    fixture.detectChanges();
    const clearBtn = fixture.debugElement.query(By.css("button"));
    clearBtn.triggerEventHandler("click", new MouseEvent("click"));
    expect(component.onSearch.emit).toHaveBeenCalledWith("");
  });

  it("should apply xs size classes for toolbar usage", () => {
    fixture.componentRef.setInput("size", "xs");
    fixture.detectChanges();
    const input = fixture.debugElement.query(By.css("input"));
    expect(input.nativeElement.className).toContain("text-xs");
  });

  it("should emit debounced search via RxJS after quiet period", async () => {
    const emitted: string[] = [];
    component.debouncedSearch.subscribe((v) => emitted.push(v));
    const input = fixture.debugElement.query(By.css("input"));
    input.nativeElement.value = "ord";
    input.triggerEventHandler("input", { target: input.nativeElement });
    expect(emitted).toEqual([]);
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(emitted).toEqual(["ord"]);
  });
});
