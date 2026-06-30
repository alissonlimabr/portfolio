import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  NgZone,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { SanityService } from '../services/sanity.service';
import { Category } from '../models/post.model';

@Component({
  selector: 'app-blog-categories',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './blog-categories.component.html',
  styleUrl: './blog-categories.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogCategoriesComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly sanity = inject(SanityService);
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  categories: Category[] = [];
  loading = true;
  error = false;

  ngOnInit(): void {
    this.sanity
      .getCategoriesWithCount()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        // Clarity faz monkey-patch no XHR e quebra o Zone do Angular —
        // por isso forçamos a callback a rodar dentro da zone.
        next: (cats) => {
          this.zone.run(() => {
            this.categories = cats ?? [];
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
}
