import { Component, OnInit } from '@angular/core';
import { faBars, faCode, faXmark } from '@fortawesome/free-solid-svg-icons';
import * as AOS from 'aos';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  faBars = faBars;
  faXmark = faXmark;
  faCode = faCode;

  ngOnInit(): void {
    AOS.init();
  }
}
