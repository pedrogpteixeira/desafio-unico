import { Routes } from '@angular/router';
export const routes: Routes = [
  { path: '', title: 'Desafio Único | Eletricidade e Gás Natural para Casa e Empresas', loadComponent: () => import('./features/site-page.component').then(m => m.SitePageComponent), data: { careers: false } },
  { path: 'carreiras', title: 'Carreiras e Candidaturas | Desafio Único', loadComponent: () => import('./features/site-page.component').then(m => m.SitePageComponent), data: { careers: true } },
  { path: '**', loadComponent: () => import('./features/not-found.component').then(m => m.NotFoundComponent), title: 'Página não encontrada — Desafio Único' },
];
