import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, DestroyRef, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { MagneticDirective } from '../../shared/directives/magnetic.directive';
import { SpotlightDirective } from '../../shared/directives/spotlight.directive';
import { ImageLoadStateDirective } from '../../shared/directives/image-load-state.directive';
import { SwipeDirective } from '../../shared/directives/swipe.directive';
import { CopyToClipboardDirective } from '../../shared/directives/copy-to-clipboard.directive';
import { SanityService } from '../../blog/services/sanity.service';
import { PostSummary } from '../../blog/models/post.model';
import { resolveCategoryColor } from '../../blog/utils/category-color.util';
import { SITE_DEFAULT_OG_IMAGE_PATH } from '../../shared/constants/site.constants';

import {
  faArrowsLeftRight,
  faArrowUpRightFromSquare,
  faBars,
  faChevronLeft,
  faCheck,
  faChevronRight,
  faCircle,
  faCode,
  faCodeCommit,
  faCopy,
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
    NgOptimizedImage,

    // FontAwesome
    FontAwesomeModule,

    // Typed Writer
    NgxTypedWriterModule,

    ParticlesAnimationComponent,
    // Directives
    MagneticDirective,
    SpotlightDirective,
    ImageLoadStateDirective,
    SwipeDirective,
    CopyToClipboardDirective,
    // Router
    RouterLink,
    // Icons
    IconComponent,
  ],
})
export class HomeComponent {
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
  faCopy = faCopy;
  faCheck = faCheck;
  readonly contactEmail = 'alissonlimabr.dev@gmail.com';
  readonly emailCopied = signal(false);
  private emailCopiedTimer: ReturnType<typeof setTimeout> | null = null;
  readonly resolveCategoryColor = resolveCategoryColor;

  mySkills = MY_SKILLS;
  socialMedia = SOCIAL_MEDIA;

  jobs = JOBS;
  readonly initialVisibleJobs = 2;
  experienceYears = this.calculateExperienceYears();
  isCareerExpanded = false;

  sanityService = inject(SanityService);
  private readonly recentPostsResponse = toSignal(
    this.sanityService.getPosts().pipe(
      map((posts) =>
        posts.slice(0, 4).map((post) => this.normalizeRecentPost(post)),
      ),
      catchError(() => of([] as PostSummary[])),
    ),
    { initialValue: null },
  );
  readonly recentPosts = computed(() => this.recentPostsResponse() ?? []);
  readonly postsLoading = computed(() => this.recentPostsResponse() === null);
  readonly hasScrollableRecentPosts = computed(
    () => this.recentPosts().length > 3,
  );

  projects: Project[] = PROJECTS;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      if (this.emailCopiedTimer !== null) {
        clearTimeout(this.emailCopiedTimer);
      }
    });
  }

  private normalizeRecentPost(post: PostSummary): PostSummary {
    const coverUrl =
      post.imageUrl && /^https?:\/\//i.test(post.imageUrl)
        ? post.imageUrl
        : undefined;

    return {
      ...post,
      imageSrcSet: this.sanityService.buildImageSrcSet(
        coverUrl,
        [320, 400, 600],
      ),
      imageUrl: coverUrl
        ? this.sanityService.optimizeImageUrl(coverUrl, { w: 600, h: 338 })
        : SITE_DEFAULT_OG_IMAGE_PATH,
    };
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

  onEmailCopied(): void {
    this.emailCopied.set(true);
    if (this.emailCopiedTimer !== null) {
      clearTimeout(this.emailCopiedTimer);
    }
    this.emailCopiedTimer = setTimeout(() => {
      this.emailCopied.set(false);
      this.emailCopiedTimer = null;
    }, 2000);
  }

  openEmailClient(): void {
    window.location.href = `mailto:${this.contactEmail}`;
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
