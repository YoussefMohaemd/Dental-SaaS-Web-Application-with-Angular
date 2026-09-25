import { ComponentFixture, TestBed } from "@angular/core/testing";
import { SettingsComponent } from "./settings.component";

describe("SettingsComponent", () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should switch sections", () => {
    component.setSection("security");
    expect(component.section()).toBe("security");
  });

  it("should toggle notification preferences", () => {
    const initial = component.notificationPrefs().orderUpdates;
    component.togglePreference("orderUpdates");
    expect(component.notificationPrefs().orderUpdates).toBe(!initial);
  });
});
