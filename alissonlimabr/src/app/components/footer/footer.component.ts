import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCode } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  standalone: true,
  imports: [FontAwesomeModule],
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
  readonly faCode = faCode;
  readonly anoAtual = new Date().getFullYear();
}
