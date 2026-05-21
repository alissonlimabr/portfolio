import { Routes } from '@angular/router';

export const BLOG_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./blog-list/blog-list.component').then(m => m.BlogListComponent),
  },
  {
    path: ':slug',
    loadComponent: () =>
      import('./blog-post/blog-post.component').then(m => m.BlogPostComponent),
  },
];
