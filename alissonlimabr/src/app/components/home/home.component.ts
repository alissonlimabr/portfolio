import { Component, OnInit } from '@angular/core';
import {
  faArrowUpRightFromSquare,
  faBars,
  faCode,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import * as AOS from 'aos';
import { AUTH_JWT_SKILLS } from 'src/app/constants/auth-jwt-skills.constant';
import { EVENT_PLATAFORM_SKILLS } from 'src/app/constants/event-plataform-skills.constant';
import { MOTOVOICE_SKILLS } from 'src/app/constants/motovoice-skills.constant';
import { MY_SKILLS } from 'src/app/constants/my-skills.constant';
import { PORTFOLIO_SKILLS } from 'src/app/constants/portfolio-skills.constant';
import { RESET_PASSWORD_SKILLS } from 'src/app/constants/reset-password-skills.constant';
import { SOCIAL_MEDIA } from 'src/app/constants/social-media.constant';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  faBars = faBars;
  faXmark = faXmark;
  faCode = faCode;
  faArrowUpRightFromSquare = faArrowUpRightFromSquare;
  mySkills = MY_SKILLS;
  skillsMotoVoice = MOTOVOICE_SKILLS;
  skillsAuthJwt = AUTH_JWT_SKILLS;
  skillsPortfolio = PORTFOLIO_SKILLS;
  skillsResetPassword = RESET_PASSWORD_SKILLS;
  skillsEventPlataform = EVENT_PLATAFORM_SKILLS;
  socialMedia = SOCIAL_MEDIA;

  ngOnInit(): void {
    AOS.init();
  }
}
