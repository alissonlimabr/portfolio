import { animate, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import {
  faArrowUpRightFromSquare,
  faBars,
  faCircle,
  faCode,
  faCodeCommit,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import * as AOS from 'aos';
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
        // Estado inicial: um pouco abaixo e transparente
        style({ opacity: 0, transform: 'translateY(20px)' }),
        // Animação para o estado final: posição original e opaco
        animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('fadeInDown', [
      transition(':enter', [
        // Estado inicial: um pouco acima e transparente
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        // Animação para o estado final: posição original e opaco
        animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
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

  selectedJob: Job = this.jobs[0];

  ngOnInit(): void {
    AOS.init({});
    // Set the first job as selected by default if jobs exist
    if (this.jobs && this.jobs.length > 0) {
      this.selectedJob = this.jobs[0];
    }
  }

  currentPage = 0;
  pageSize = 3;

  get totalPages(): number {
    return Math.ceil(this.jobs.length / this.pageSize);
  }

  get pagesArray(): number[] {
    return Array(this.totalPages).fill(0).map((x, i) => i);
  }

  get paginatedJobs(): Job[] {
    const startIndex = this.currentPage * this.pageSize;
    return this.jobs.slice(startIndex, startIndex + this.pageSize);
  }

  changePage(page: number) {
    this.currentPage = page;
    // Update selectedJob to the first job of the new page
    const currentPaginatedJobs = this.paginatedJobs;
    if (currentPaginatedJobs.length > 0) {
      this.selectedJob = currentPaginatedJobs[0];
    }
  }

  selectJob(job: Job) {
    this.selectedJob = job;
  }
}
