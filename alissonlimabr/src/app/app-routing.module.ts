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
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    initialNavigation: 'enabledBlocking'
})],
  exports: [RouterModule],
})
export class AppRoutingModule {}
