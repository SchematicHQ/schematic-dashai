import { Injectable, inject } from '@angular/core';
import { SchematicService } from '@schematichq/schematic-angular';

@Injectable({ providedIn: 'root' })
export class IdentityService {
  private schematic = inject(SchematicService);

  initialize(): void {
    this.schematic.identify({
      keys: {
        id: 'demo-user',
        email: 'demo@example.com',
      },
      name: 'Demo User',
      company: {
        keys: {
          id: 'demo',
        },
      },
    });
  }
}
