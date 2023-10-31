import { Component } from '@angular/core';
import { faBars, faCode, faXmark } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  faBars = faBars;
  faXmark = faXmark;
  faCode = faCode;
}
