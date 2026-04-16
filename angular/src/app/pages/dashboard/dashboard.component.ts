import { Component } from '@angular/core';
import { GeneratedDashboardComponent } from '../../components/generated-dashboard/generated-dashboard.component';

@Component({
  selector: 'app-dashboard',
  imports: [GeneratedDashboardComponent],
  template: `
    <div class="min-h-screen flex flex-col">
      <main class="flex-1 p-6">
        <div class="max-w-7xl mx-auto">
          <app-generated-dashboard />
        </div>
      </main>
    </div>
  `,
})
export class DashboardComponent {}
