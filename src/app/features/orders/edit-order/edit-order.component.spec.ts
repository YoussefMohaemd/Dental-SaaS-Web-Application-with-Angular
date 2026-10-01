import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideRouter } from "@angular/router";
import { EditOrderComponent } from "./edit-order.component";

describe("EditOrderComponent", () => {
  let component: EditOrderComponent;
  let fixture: ComponentFixture<EditOrderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditOrderComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should build the edit form with validation", () => {
    expect(component.editForm).toBeTruthy();
    component.editForm.controls.units.setValue(0);
    expect(component.editForm.controls.units.invalid).toBeTrue();
    component.editForm.controls.units.setValue(2);
    expect(component.editForm.controls.units.valid).toBeTrue();
  });

  it("should toggle the order lock", () => {
    const initial = component.isLocked();
    component.toggleLock();
    expect(component.isLocked()).toBe(!initial);
  });

  it("should flag invalid required fields", () => {
    component.editForm.controls.patientName.setValue("");
    component.editForm.controls.patientName.markAsTouched();
    expect(component.fieldInvalid("patientName")).toBeTrue();
  });

  it("should keep doctor and clinic optional", () => {
    component.editForm.controls.patientName.setValue("Alice Johnson");
    component.editForm.controls.doctorName.setValue("");
    component.editForm.controls.clinicId.setValue("");
    expect(component.editForm.valid).toBeTrue();
  });

  it("should require teeth for services that need them", () => {
    component.editForm.controls.patientName.setValue("Alice Johnson");
    component.toggleService("surgical-guide");
    expect(component.canSave()).toBeFalse();
    component.setServiceTeethInput("surgical-guide", "11, 12");
    expect(component.canSave()).toBeTrue();
  });

  it("should allow removing and adding teeth interactively in edit mode", () => {
    component.toggleService("gfmr");
    component.setServiceTeethInput("gfmr", "11, 12");
    component.toggleServiceTooth("gfmr", 12);
    component.toggleServiceTooth("gfmr", 21);
    expect(component.teethInputValue("gfmr")).toBe("11, 21");
    component.clearServiceTeeth("gfmr");
    expect(component.teethInputValue("gfmr")).toBe("");
  });
});
