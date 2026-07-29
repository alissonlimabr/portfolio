import {
  bootstrapApplication,
  provideClientHydration,
} from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app/app-routing.module';
import {
  provideHttpClient,
  withFetch,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { AppComponent } from './app/app.component';

// Bootstrap standalone
bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(BrowserAnimationsModule),
    importProvidersFrom(AppRoutingModule),
    provideHttpClient(withFetch(), withInterceptorsFromDi()),
    // O prerender usa AppModule; a hidratação precisa existir nos dois lados.
    provideClientHydration(),
  ],
}).catch((err) => console.error(err));
