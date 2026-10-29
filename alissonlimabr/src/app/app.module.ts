import { NgModule, provideZonelessChangeDetection } from '@angular/core';
import {
  BrowserModule,
  provideClientHydration,
  withNoIncrementalHydration
} from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptorsFromDi } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

@NgModule({
  imports: [
    BrowserModule,
    AppRoutingModule,
    AppComponent,
  ],
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(withFetch(), withInterceptorsFromDi()),
    // main.ts fornece o mesmo provider no bootstrap standalone do navegador.
    provideClientHydration(withNoIncrementalHydration()),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
