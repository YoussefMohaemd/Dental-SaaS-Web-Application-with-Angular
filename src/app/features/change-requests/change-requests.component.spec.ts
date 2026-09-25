import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideRouter } from "@angular/router";
import { ChangeRequestsComponent } from "./change-requests.component";

describe("ChangeRequestsComponent", () => {
  let component: ChangeRequestsComponent;
  let fixture: ComponentFixture<ChangeRequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangeRequestsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangeRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should filter actionable statuses", () => {
    expect(component.isActionable("Pending")).toBeTrue();
    expect(component.isActionable("In Review")).toBeTrue();
    expect(component.isActionable("Approved")).toBeFalse();
  });

  it("should reset pagination on search", () => {
    component.page.set(4);
    component.onSearchChange({ target: { value: "DL" } } as unknown as Event);
    expect(component.page()).toBe(1);
  });
});
