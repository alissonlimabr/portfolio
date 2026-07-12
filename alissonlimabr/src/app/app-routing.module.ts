import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './portfolio/home/home.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'blog',
    loadChildren: () =>
      import('./blog/blog.routes').then(m => m.BLOG_ROUTES),
  },
  {
    path: '404',
    loadComponent: () =>
      import('./not-found/not-found.component').then(
        m => m.NotFoundComponent,
      ),
  },
  { path: '**', redirectTo: '404' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    initialNavigation: 'enabledBlocking'
})],
  exports: [RouterModule],
})
export class AppRoutingModule {}
