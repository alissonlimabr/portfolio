import { Routes } from '@angular/router';

export const BLOG_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./blog-list/blog-list.component').then(m => m.BlogListComponent),
  },
  {
    path: 'categorias',
    loadComponent: () =>
      import('./blog-categories/blog-categories.component').then(m => m.BlogCategoriesComponent),
  },
  {
    path: 'categoria/:slug',
    loadComponent: () =>
      import('./blog-list/blog-list.component').then(m => m.BlogListComponent),
  },
  {
    path: ':slug',
    loadComponent: () =>
      import('./blog-post/blog-post.component').then(m => m.BlogPostComponent),
  },
];
