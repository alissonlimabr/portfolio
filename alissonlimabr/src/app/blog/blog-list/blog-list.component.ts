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

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }
}
