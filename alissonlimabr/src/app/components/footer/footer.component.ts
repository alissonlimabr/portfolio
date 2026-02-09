import { Component } from '@angular/core';
import { MatSidenavContent } from '@angular/material/sidenav';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCode } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  standalone: true,
  imports: [
    MatSidenavContent,
    FontAwesomeModule,
  ],
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
  faCode = faCode;
  anoAtual: number = new Date().getFullYear();
}
