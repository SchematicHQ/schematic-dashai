import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SchematicService } from '@schematichq/schematic-angular';
import { SchematicApiService } from '../../services/schematic-api.service';
import { SchematicEmbedComponent } from '../../components/schematic-embed/schematic-embed.component';
import { environment } from '../../../environments/environment.development';

/**
 * SIGNAL PATTERN: Uses Angular signals for loading/token state
 * and toSignal() for Schematic SDK observables.
 */
@Component({
  selector: 'app-pricing',
  imports: [SchematicEmbedComponent],
  template: `
    <div class="min-h-screen bg-background">
      <div class="container mx-auto px-6 py-4">
        <h1 class="text-2xl font-bold mb-4">Pricing</h1>

        @if (isLoading()) {
          <p class="text-muted-foreground">Loading...</p>
        } @else if (error()) {
          <p class="text-destructive">{{ error() }}</p>
        } @else if (accessToken()) {
          <!-- Signal pattern: isPending as a signal -->
          @if (isPending()) {
            <p class="text-muted-foreground animate-pulse mb-2">
              Schematic SDK loading...
            </p>
          }
          <app-schematic-embed
            [accessToken]="accessToken()"
            [componentId]="componentId"
          />
        }
      </div>
    </div>
  `,
})
export class PricingComponent implements OnInit {
  private api = inject(SchematicApiService);
  private schematic = inject(SchematicService);

  // Signal pattern: all state as signals
  accessToken = signal<string | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  componentId = environment.schematicPricingTableId;

  // Signal pattern: convert isPending$ observable to signal
  isPending = toSignal(this.schematic.isPending$(), { initialValue: true });

  ngOnInit(): void {
    this.api.getAccessToken().subscribe({
      next: (res) => {
        this.accessToken.set(res.accessToken);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching access token:', err);
        this.error.set('Error fetching data');
        this.isLoading.set(false);
      },
    });
  }
}
