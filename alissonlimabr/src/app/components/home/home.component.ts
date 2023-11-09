import { Component, OnInit } from '@angular/core';
import {
  faArrowUpRightFromSquare,
  faBars,
  faCode,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import * as AOS from 'aos';
import { MY_SKILLS } from '../constants/my-skills.constant';
import { MOTOVOICE_SKILLS } from '../constants/motovoice-skills.constant';
import { AUTH_JWT_SKILLS } from '../constants/auth-jwt-skills.constant';
import { RESET_PASSWORD_SKILLS } from '../constants/reset-password-skills.constant';
import { PORTFOLIO_SKILLS } from '../constants/portfolio-skills.constant';
import { SOCIAL_MEDIA } from '../constants/social-media.constant';

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
  socialMedia = SOCIAL_MEDIA;

  ngOnInit(): void {
    AOS.init();
  }
}
