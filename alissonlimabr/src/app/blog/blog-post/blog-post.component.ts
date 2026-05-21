import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { switchMap } from 'rxjs';
import { SanityService } from '../services/sanity.service';
import { Post } from '../models/post.model';

@Component({
  selector: 'app-blog-post',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './blog-post.component.html',
})
export class BlogPostComponent implements OnInit {
  post?: Post;
  bodyHtml?: SafeHtml;
  loading = true;
  notFound = false;

  constructor(
    private route: ActivatedRoute,
    private sanity: SanityService,
    private sanitizer: DomSanitizer,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(switchMap(params => this.sanity.getPost(params.get('slug')!)))
      .subscribe({
        // Clarity faz monkey-patch no XHR e quebra o Zone do Angular —
        // por isso forçamos a callback a rodar dentro da zone.
        next: post => {
          this.zone.run(() => {
            if (!post) {
              this.notFound = true;
              this.loading = false;
              this.cdr.markForCheck();
              return;
            }
            if (post.imageUrl && !/^https?:\/\//i.test(post.imageUrl)) {
              post.imageUrl = undefined;
            }
            this.post = post;
            this.bodyHtml = this.sanitizer.bypassSecurityTrustHtml(
              this.sanity.portableTextToHtml(post.body)
            );
            this.loading = false;
            this.cdr.markForCheck();
          });
        },
        error: () => {
          this.zone.run(() => {
            this.notFound = true;
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
