import {
  bootstrapApplication,
  provideClientHydration,
  withNoIncrementalHydration
} from '@angular/platform-browser';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { AppRoutingModule } from './app/app-routing.module';
import {
  provideHttpClient,
  withFetch,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { printConsoleGreeting } from './console-greeting';

// Bootstrap standalone
bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    importProvidersFrom(AppRoutingModule),
    provideHttpClient(withFetch(), withInterceptorsFromDi()),
    // O prerender usa AppModule; a hidratação precisa existir nos dois lados.
    provideClientHydration(withNoIncrementalHydration()),
  ],
})
  .then(() => printConsoleGreeting())
  .catch((err) => console.error(err));
