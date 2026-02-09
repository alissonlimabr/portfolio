import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app/app-routing.module';
import Clarity from '@microsoft/clarity';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AppComponent } from './app/app.component';

// Inicializa Clarity
Clarity.init('pexxkhasj2');

// Bootstrap standalone
bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(BrowserAnimationsModule),
    importProvidersFrom(AppRoutingModule),
    provideHttpClient(withInterceptorsFromDi())   // 🔹 Alternativa ao HttpClient
  ]
}).catch(err => console.error(err));
