import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { SanityService } from '../services/sanity.service';
import { PostSummary } from '../models/post.model';

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [RouterLink, MatCardModule],
  templateUrl: './blog-list.component.html',
})
export class BlogListComponent implements OnInit {
  posts: PostSummary[] = [];
  loading = true;
  error = false;
  searchTerm = '';
  currentPage = 1;
  readonly pageSize = 6;

  constructor(
    private sanity: SanityService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.sanity.getPosts().subscribe({
      // Clarity faz monkey-patch no XHR e quebra o Zone do Angular —
      // por isso forcei a callback a rodar dentro da zone.
      next: posts => {
        this.zone.run(() => {
          this.posts = (posts ?? []).map(p => ({
            ...p,
            imageUrl: p.imageUrl && /^https?:\/\//i.test(p.imageUrl) ? p.imageUrl : undefined,
          }));
          this.loading = false;
          this.cdr.markForCheck();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.error = true;
          this.loading = false;
          this.cdr.markForCheck();
        });
      },
    });
  }

  get filteredPosts(): PostSummary[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.posts;
    return this.posts.filter(
      p =>
        p.title.toLowerCase().includes(term) ||
        (p.excerpt?.toLowerCase().includes(term) ?? false) ||
        (p.tags?.some(t => t.toLowerCase().includes(term)) ?? false)
    );
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredPosts.length / this.pageSize));
  }

  get pagedPosts(): PostSummary[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredPosts.slice(start, start + this.pageSize);
  }

  get pageNumbers(): (number | null)[] {
    const total = this.totalPages;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | null)[] = [1];
    if (this.currentPage > 3) pages.push(null);
    const start = Math.max(2, this.currentPage - 1);
    const end = Math.min(total - 1, this.currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (this.currentPage < total - 2) pages.push(null);
    pages.push(total);
    return pages;
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }
}
