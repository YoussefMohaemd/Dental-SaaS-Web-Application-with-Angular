import { TestBed } from "@angular/core/testing";
import { ThemeService } from "./theme.service";

describe("ThemeService", () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.setAttribute("data-theme", "light");
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  it("should create defaulting to light mode (React parity)", () => {
    service.init();
    expect(service.isDark()).toBeFalse();
    expect(service.theme()).toBe("light");
  });

  it("should toggle between dark and light and update the icon state", () => {
    service.init();
    service.toggle();
    expect(service.isDark()).toBeTrue();
    expect(service.theme()).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    service.toggle();
    expect(service.isDark()).toBeFalse();
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("should persist the theme across init", () => {
    service.init();
    service.setTheme("dark");
    expect(localStorage.getItem("dentalab-theme")).toBe("dark");

    const reloaded = TestBed.inject(ThemeService);
    reloaded.init();
    expect(reloaded.isDark()).toBeTrue();
  });

  it("should respect an explicit stored light preference", () => {
    localStorage.setItem("dentalab-theme", "light");
    service.init();
    expect(service.isDark()).toBeFalse();
  });
});
