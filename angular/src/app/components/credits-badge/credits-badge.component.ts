import { Component, inject } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { SchematicService, CheckFlagReturn } from '@schematichq/schematic-angular';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-credits-badge',
  imports: [AsyncPipe, DecimalPipe],
  template: `
    @if (entitlement$ | async; as ent) {
      @if (ent.creditRemaining != null) {
        <div
          class="inline-flex items-center rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground"
        >
          <span class="mr-1 h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
          <span>{{ ent.creditRemaining | number }} credits remaining</span>
        </div>
      }
    }
  `,
})
export class CreditsBadgeComponent {
  private schematic = inject(SchematicService);

  entitlement$: Observable<CheckFlagReturn> =
    this.schematic.entitlement$('dashboard-prompt');
}
