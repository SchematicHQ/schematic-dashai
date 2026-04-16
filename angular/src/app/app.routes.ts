import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'team',
    loadComponent: () =>
      import('./pages/team/team.component').then((m) => m.TeamComponent),
  },
  {
    path: 'data-sources',
    loadComponent: () =>
      import('./pages/data-sources/data-sources.component').then(
        (m) => m.DataSourcesComponent
      ),
  },
  {
    path: 'plan',
    loadComponent: () =>
      import('./pages/plan/plan.component').then((m) => m.PlanComponent),
  },
  {
    path: 'pricing',
    loadComponent: () =>
      import('./pages/pricing/pricing.component').then(
        (m) => m.PricingComponent
      ),
  },
];
