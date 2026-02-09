import { Component, EventEmitter, Output } from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBars, faCode, faXmark } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  standalone: true,
  imports: [
    FontAwesomeModule,
    MatToolbar,
  ],
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
