import { NgModule } from '@angular/core';
import {
  BrowserModule,
  provideClientHydration,
} from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient, withFetch, withInterceptorsFromDi } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    AppComponent,
  ],
  providers: [
    provideHttpClient(withFetch(), withInterceptorsFromDi()),
    // main.ts fornece o mesmo provider no bootstrap standalone do navegador.
    provideClientHydration(),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
