import { signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { AuthorizationService } from "@core/services/authorization.service";
import { NavigationService } from "@core/services/navigation.service";
import { AiChatFacade } from "./ai-chat.facade";

describe("AiChatFacade", () => {
  let facade: AiChatFacade;
  let authorizationService: jasmine.SpyObj<AuthorizationService>;
  let navigationService: jasmine.SpyObj<NavigationService>;

  beforeEach(() => {
    authorizationService = jasmine.createSpyObj<AuthorizationService>(
      "AuthorizationService",
      ["has"],
    );
    authorizationService.has.and.returnValue(true);

    navigationService = jasmine.createSpyObj<NavigationService>(
      "NavigationService",
      ["navigate"],
      { isMobile: signal(false) },
    );

    TestBed.configureTestingModule({
      providers: [
        AiChatFacade,
        { provide: AuthorizationService, useValue: authorizationService },
        { provide: NavigationService, useValue: navigationService },
      ],
    });

    facade = TestBed.inject(AiChatFacade);
  });

  it("should start with welcome state", () => {
    expect(facade.showWelcome()).toBeTrue();
    expect(facade.messages().length).toBeGreaterThan(0);
    expect(facade.quickActions().length).toBeGreaterThan(0);
  });

  it("should append assistant reply and hide welcome after submit", async () => {
    facade.submitPrompt("show services");
    expect(facade.messages().at(-1)?.role).toBe("thinking");
    await new Promise((resolve) => setTimeout(resolve, 700));

    expect(facade.showWelcome()).toBeFalse();
    expect(facade.messages().at(-1)?.role).toBe("assistant");
  });

  it("should block delete intent before capability denial", async () => {
    authorizationService.has.and.callFake((capability: string) =>
      capability === "reports.read" ? false : true,
    );

    facade.submitPrompt("delete order ord-10");
    await new Promise((resolve) => setTimeout(resolve, 700));

    const latest = facade.messages().at(-1)?.text.toLowerCase() ?? "";
    expect(latest).toContain("can't delete");
    expect(latest).not.toContain("don't have access");
  });
});
