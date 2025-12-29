import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
      }
    ]
  },
  {
    path: 'profile/:id',
    loadComponent: () => import('./features/profile/profile-page/profile-page.component').then(m => m.ProfilePageComponent),
    canActivate: [() => import('./core/guards/auth.guard').then(m => m.authGuard)]
  },
  {
    path: 'search',
    loadComponent: () => import('./features/search/search-page/search-page.component').then(m => m.SearchPageComponent),
    canActivate: [() => import('./core/guards/auth.guard').then(m => m.authGuard)]
  },
  {
    path: 'settings',
    children: [
      {
        path: 'blocking',
        loadComponent: () => import('./features/settings/blocking/blocking.component').then(m => m.BlockingComponent),
        canActivate: [() => import('./core/guards/auth.guard').then(m => m.authGuard)]
      }
    ]
  },
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' }
];
