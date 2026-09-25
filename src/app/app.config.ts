import { provideRouter, withViewTransitions } from "@angular/router";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { providePrimeNG } from "primeng/config";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { TUI_ENGLISH_LANGUAGE, TUI_LANGUAGE } from "@taiga-ui/i18n";
import { of } from "rxjs";
import Aura from "@primeng/themes/aura";
import { AppComponent } from "./app.component";
import { appRoutes } from "./app.routes";
import { authInterceptor } from "./core/interceptors/auth.interceptor";
import { ThemeService } from "./core/services/theme.service";
import {
  ApplicationConfig,
  provideZonelessChangeDetection,
} from "@angular/core";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(appRoutes, withViewTransitions()),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '[data-theme="dark"]',
          cssLayer: false,
        },
      },
    }),
    { provide: TUI_LANGUAGE, useValue: of(TUI_ENGLISH_LANGUAGE) },
    ThemeService,
  ],
};
