import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgxParticlesModule } from '@tsparticles/angular';
import { NgxTypedWriterModule } from 'ngx-typed-writer';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { HomeComponent } from './components/home/home.component';
import { JsonLdComponent } from './components/json-ld/json-ld.component';
import { ParticlesAnimationComponent } from './components/particles-animation/ParticlesAnimationComponent';
import { MaterialModule } from './material/material.module';
import { GoogleTagManagerModule } from 'angular-google-tag-manager';
import Clarity from '@microsoft/clarity';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    HeaderComponent,
    FooterComponent,
    JsonLdComponent,
    ParticlesAnimationComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MaterialModule,
    FontAwesomeModule,
    NgxTypedWriterModule,
    NgxParticlesModule,
    GoogleTagManagerModule.forRoot({
      id: 'GTM-NMP4ZJHK',
    }),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor() {
    //microfost clarity
    Clarity.init('pexxkhasj2')
  }
}
