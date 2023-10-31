import { Component, EventEmitter, Output } from '@angular/core';
import { faBars, faCode, faXmark } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @Output() openSidenav = new EventEmitter();

  faCode = faCode;
  faBars = faBars;
  faXmark = faXmark;
  opened?: boolean;

  closeSideNav() {
    this.opened = false;
  }
}
