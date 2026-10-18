import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './portfolio/home/home.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'blog',
    loadChildren: () => import('./blog/blog.routes').then((m) => m.BLOG_ROUTES),
  },
  {
    path: '404',
    loadComponent: () =>
      import('./not-found/not-found.component').then(
        (m) => m.NotFoundComponent,
      ),
  },
  // Sem redirect: mantém na barra de endereço a URL que o visitante pediu
  {
    path: '**',
    loadComponent: () =>
      import('./not-found/not-found.component').then(
        (m) => m.NotFoundComponent,
      ),
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      initialNavigation: 'enabledBlocking',
      anchorScrolling: 'disabled',
      scrollPositionRestoration: 'disabled',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
