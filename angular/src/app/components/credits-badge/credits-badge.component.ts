import { Component, inject, OnInit, signal } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { SchematicService, CheckFlagReturn } from '@schematichq/schematic-angular';
import { Observable } from 'rxjs';
import {
  SchematicApiService,
  CreditBalance,
} from '../../services/schematic-api.service';

/**
 * OBSERVABLE PATTERN: Uses async pipe for the Schematic entitlement$ observable.
 * The API credit balance uses a signal so zoneless change detection picks it up.
 */
@Component({
  selector: 'app-credits-badge',
  imports: [AsyncPipe, DecimalPipe],
  template: `
    @if (entitlement$ | async; as ent) {
      <div class="inline-flex flex-col items-end gap-1">
        <div
          class="inline-flex items-center rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground"
        >
          <span class="mr-1 h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
          <span>{{ getRemainingCredits() | number }} credits remaining</span>
        </div>
      </div>
    }
  `,
})
export class CreditsBadgeComponent implements OnInit {
  private schematic = inject(SchematicService);
  private api = inject(SchematicApiService);

  entitlement$: Observable<CheckFlagReturn> =
    this.schematic.entitlement$('dashboard-prompt');
  balance = signal<CreditBalance | null>(null);

  ngOnInit(): void {
    this.api.getCreditBalance().subscribe({
      next: (data) => this.balance.set(data),
      error: (err) => console.error('Error fetching credit balance:', err),
    });
  }

  getRemainingCredits(): number {
    const bal = this.balance();
    if (!bal) return 0;
    return Math.max(0, bal.allocation - bal.usage);
  }
}
