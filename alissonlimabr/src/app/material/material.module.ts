import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';

// Módulo de components do Angular
@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatCheckboxModule,
  ],
  exports: [
    MatCardModule,
    MatButtonModule,
    MatTooltipModule,
    MatIconModule,
    MatProgressBarModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatCheckboxModule,
  ],
})
export class MaterialModule {}
