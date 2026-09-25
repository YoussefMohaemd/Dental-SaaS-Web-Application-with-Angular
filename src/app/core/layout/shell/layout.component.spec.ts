import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { LayoutComponent } from "./layout.component";
import { RouterOutlet } from "@angular/router";

describe("LayoutComponent", () => {
  let component: LayoutComponent;
  let fixture: ComponentFixture<LayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutComponent, RouterOutlet],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render sidebar", () => {
    const sidebar = fixture.debugElement.query(By.css("app-sidebar"));
    expect(sidebar).toBeTruthy();
  });

  it("should render header", () => {
    const header = fixture.debugElement.query(By.css("app-header"));
    expect(header).toBeTruthy();
  });

  it("should render router outlet", () => {
    const outlet = fixture.debugElement.query(By.css("router-outlet"));
    expect(outlet).toBeTruthy();
  });

  it("should have correct layout structure", () => {
    const main = fixture.debugElement.query(By.css("main.flex-1"));
    expect(main).toBeTruthy();
  });
});
