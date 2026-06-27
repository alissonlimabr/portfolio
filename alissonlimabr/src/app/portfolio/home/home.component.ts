import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnInit,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MagneticDirective } from '../../shared/directives/magnetic.directive';
import { SpotlightDirective } from '../../shared/directives/spotlight.directive';
import { SanityService } from '../../blog/services/sanity.service';
import { PostSummary } from '../../blog/models/post.model';

import {
  faArrowsLeftRight,
  faArrowUpRightFromSquare,
  faBars,
  faChevronLeft,
  faChevronRight,
  faCircle,
  faCode,
  faCodeCommit,
  faHandPointer,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgxTypedWriterModule } from 'ngx-typed-writer';
import { JOBS } from 'src/app/portfolio/constants/jobs.constant';
import { MY_SKILLS } from 'src/app/portfolio/constants/my-skills.constant';
import { PROJECTS } from 'src/app/portfolio/constants/projects.constant';
import { SOCIAL_MEDIA } from 'src/app/portfolio/constants/social-media.constant';
import { ParticlesAnimationComponent } from '../../components/particles-animation/ParticlesAnimationComponent';
import { IconComponent } from '../../shared/icon.component';

interface Job {
  company: string;
  position: string;
  description: string[];
  duration: string;
  icon: string;
}

interface Project {
  title: string;
  subtitle: string;
  description: string;
  url?: string;
  skills: { icon: string; alt: string; name?: string }[];
  size: 'featured' | 'standard' | 'placeholder';
}

const MONTH_INDEX: Record<string, number> = {
  janeiro: 0,
  fevereiro: 1,
  marco: 2,
  abril: 3,
  maio: 4,
  junho: 5,
  julho: 6,
  agosto: 7,
  setembro: 8,
  outubro: 9,
  novembro: 10,
  dezembro: 11,
};

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    CommonModule,

    // FontAwesome
    FontAwesomeModule,

    // Typed Writer
    NgxTypedWriterModule,

    ParticlesAnimationComponent,
    // Directives
    MagneticDirective,
    SpotlightDirective,
    // Router
    RouterLink,
    // Icons
    IconComponent,
  ],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate(
          '0.5s ease-out',
          style({ opacity: 1, transform: 'translateY(0)' }),
        ),
      ]),
    ]),
    trigger('fadeInDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate(
          '0.5s ease-out',
          style({ opacity: 1, transform: 'translateY(0)' }),
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
  faArrowsLeftRight = faArrowsLeftRight;
  faChevronRight = faChevronRight;
  faChevronLeft = faChevronLeft;
  faHandPointer = faHandPointer;

  mySkills = MY_SKILLS;
  socialMedia = SOCIAL_MEDIA;

  jobs = JOBS;
  readonly initialVisibleJobs = 2;
  experienceYears = this.calculateExperienceYears();
  isCareerExpanded = false;

  sanityService = inject(SanityService);
  recentPosts: PostSummary[] = [];
  postsLoading = true;
  private readonly destroyRef = inject(DestroyRef);

  projects: Project[] = PROJECTS;

  async ngOnInit(): Promise<void> {
    this.sanityService
      .getPosts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (posts) => {
          this.recentPosts = posts.slice(0, 3);
          this.postsLoading = false;
        },
        error: () => {
          this.postsLoading = false;
        },
      });
  }

  get visibleJobs(): Job[] {
    return this.isCareerExpanded
      ? this.jobs
      : this.jobs.slice(0, this.initialVisibleJobs);
  }

  get hiddenJobsCount(): number {
    return Math.max(this.jobs.length - this.initialVisibleJobs, 0);
  }

  get hasHiddenJobs(): boolean {
    return this.hiddenJobsCount > 0;
  }

  toggleCareerList(): void {
    this.isCareerExpanded = !this.isCareerExpanded;
  }

  private calculateExperienceYears(): number {
    const workedMonths = new Set<string>();

    for (const job of this.jobs) {
      const range = this.parseDurationRange(job.duration);

      if (!range) {
        continue;
      }

      const cursor = new Date(
        range.start.getFullYear(),
        range.start.getMonth(),
        1,
      );
      const end = new Date(range.end.getFullYear(), range.end.getMonth(), 1);

      while (cursor <= end) {
        workedMonths.add(`${cursor.getFullYear()}-${cursor.getMonth()}`);
        cursor.setMonth(cursor.getMonth() + 1);
      }
    }

    return Math.floor(workedMonths.size / 12);
  }

  private parseDurationRange(
    duration: string,
  ): { start: Date; end: Date } | null {
    const [rawStart, rawEnd] = duration.split(' - ').map((part) => part.trim());

    if (!rawStart || !rawEnd) {
      return null;
    }

    const start = this.parseMonthYear(rawStart);
    const end =
      rawEnd.toLowerCase() === 'atualmente'
        ? new Date()
        : this.parseMonthYear(rawEnd);

    if (!start || !end) {
      return null;
    }

    return {
      start: new Date(start.getFullYear(), start.getMonth(), 1),
      end: new Date(end.getFullYear(), end.getMonth(), 1),
    };
  }

  private parseMonthYear(value: string): Date | null {
    const normalizedValue = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const [monthName, yearText] = normalizedValue.split(/\s+/);
    const month = MONTH_INDEX[monthName];
    const year = Number.parseInt(yearText, 10);

    if (month === undefined || Number.isNaN(year)) {
      return null;
    }

    return new Date(year, month, 1);
  }
}
