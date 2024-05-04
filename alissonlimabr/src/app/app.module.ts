import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { MaterialModule } from './material/material.module';
import { HeaderComponent } from './components/header/header.component';
import { NgxTypedWriterModule } from 'ngx-typed-writer';
import { FooterComponent } from './components/footer/footer.component';
import { JsonLdComponent } from './components/json-ld/json-ld.component';
import { NgxParticlesModule } from '@tsparticles/angular';
import { ParticlesAnimationComponent } from './components/particles-animation/ParticlesAnimationComponent';

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
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
