import { Routes } from '@angular/router';
export const routes: Routes = [
  { path: '', title: 'Desafio Único — Energia que nos liga', loadComponent: () => import('./features/site-page.component').then(m => m.SitePageComponent), data: { careers: false } },
  { path: 'carreiras', title: 'Carreiras — Desafio Único', loadComponent: () => import('./features/site-page.component').then(m => m.SitePageComponent), data: { careers: true } },
  { path: '**', loadComponent: () => import('./features/not-found.component').then(m => m.NotFoundComponent), title: 'Página não encontrada — Desafio Único' },
];
