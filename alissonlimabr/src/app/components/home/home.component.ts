import { animate, style, transition, trigger } from '@angular/animations';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import {
  faArrowUpRightFromSquare,
  faBars,
  faCircle,
  faCode,
  faCodeCommit,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';

import { AUTH_JWT_SKILLS } from 'src/app/constants/auth-jwt-skills.constant';
import { EVENT_PLATAFORM_SKILLS } from 'src/app/constants/event-plataform-skills.constant';
import { JOBS } from 'src/app/constants/jobs.constant';
import { MOTOVOICE_SKILLS } from 'src/app/constants/motovoice-skills.constant';
import { MY_SKILLS } from 'src/app/constants/my-skills.constant';
import { PORTFOLIO_SKILLS } from 'src/app/constants/portfolio-skills.constant';
import { RESET_PASSWORD_SKILLS } from 'src/app/constants/reset-password-skills.constant';
import { SOCIAL_MEDIA } from 'src/app/constants/social-media.constant';

interface Job {
  company: string;
  position: string;
  description: string[];
  duration: string;
  icon: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate(
          '0.5s ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),
    trigger('fadeInDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate(
          '0.5s ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),
  ],
})
export class HomeComponent implements OnInit {
  faBars = faBars;
  faXmark = faXmark;
  faCode = faCode;
  faCircle = faCircle;
  faArrowUpRightFromSquare = faArrowUpRightFromSquare;
  faCodeCommit = faCodeCommit;

  mySkills = MY_SKILLS;
  skillsMotoVoice = MOTOVOICE_SKILLS;
  skillsAuthJwt = AUTH_JWT_SKILLS;
  skillsPortfolio = PORTFOLIO_SKILLS;
  skillsResetPassword = RESET_PASSWORD_SKILLS;
  skillsEventPlataform = EVENT_PLATAFORM_SKILLS;
  socialMedia = SOCIAL_MEDIA;

  jobs = JOBS;
  selectedJob!: Job;

  currentPage = 0;
  pageSize = 3;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  async ngOnInit(): Promise<void> {
    if (this.jobs?.length) {
      this.selectedJob = this.jobs[0];
    }

    // ✅ AOS 100% SSR-safe
    if (isPlatformBrowser(this.platformId)) {
      const AOS = await import('aos');
      AOS.init({ once: true });
    }
  }

  get totalPages(): number {
    return Math.ceil(this.jobs.length / this.pageSize);
  }

  get pagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  get paginatedJobs(): Job[] {
    const startIndex = this.currentPage * this.pageSize;
    return this.jobs.slice(startIndex, startIndex + this.pageSize);
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.selectedJob = this.paginatedJobs[0];
  }

  selectJob(job: Job): void {
    this.selectedJob = job;
  }
}
