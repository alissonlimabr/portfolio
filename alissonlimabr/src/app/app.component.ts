import { Component } from '@angular/core';
import { faBars, faCode, faXmark } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'alissonlimabr';
  faBars = faBars;
  faXmark = faXmark;
  faCode = faCode;
  opened?: boolean;

  closeSideNav() {
    this.opened = false;
  }
}
