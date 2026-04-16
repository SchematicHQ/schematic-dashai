import { Component, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SchematicService } from '@schematichq/schematic-angular';
import {
  SchematicApiService,
  DataSource,
} from '../../services/schematic-api.service';

interface AvailableSource {
  name: string;
  type: string;
  icon: string;
}

/**
 * SIGNAL PATTERN: Uses toSignal() to convert the entitlement$ observable
 * for the data-sources feature.
 */
@Component({
  selector: 'app-data-sources',
  imports: [],
  template: `
    <div class="min-h-screen flex flex-col">
      <main class="flex-1 p-6">
        <div class="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 class="text-2xl font-bold mb-1">Data Sources</h1>
            <p class="text-muted-foreground">
              Connect and manage your data sources
            </p>
          </div>

          @if (atLimit()) {
            <div
              class="rounded-lg border border-violet-800/80 bg-violet-950/40 p-4 flex items-center justify-between"
            >
              <div class="flex items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-violet-400 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="8" y2="12" />
                  <line x1="12" x2="12.01" y1="16" y2="16" />
                </svg>
                <div>
                  <p class="text-sm font-medium text-violet-100">
                    Data source limit reached
                  </p>
                  <p class="text-xs text-violet-300">
                    Upgrade your plan to connect more data sources
                  </p>
                </div>
              </div>
              <a
                href="/pricing"
                class="inline-flex items-center gap-2 rounded-md bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium h-9 px-3 shrink-0"
              >
                Upgrade
              </a>
            </div>
          }

          <div class="rounded-lg border border-border bg-card">
            <div class="p-4 border-b border-border">
              <div class="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-accent"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                  <path d="M3 5V19A9 3 0 0 0 21 19V5" />
                  <path d="M3 12A9 3 0 0 0 21 12" />
                </svg>
                <h3 class="text-lg font-semibold">Connected Sources</h3>
              </div>
              <p class="text-sm text-muted-foreground mt-1">
                Data sources currently integrated with your dashboards
              </p>
            </div>
            <div class="p-4">
              @if (isLoading()) {
                <p class="text-sm text-muted-foreground">Loading...</p>
              } @else {
                <div class="space-y-3">
                  @for (source of connectedSources(); track source.id) {
                    <div
                      class="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                    >
                      <div class="flex items-center gap-3">
                        <span class="text-xl">{{ source.icon }}</span>
                        <div>
                          <p class="text-sm font-medium">{{ source.name }}</p>
                          <p class="text-xs text-muted-foreground">
                            {{ source.type }}
                          </p>
                        </div>
                      </div>
                      <div class="flex items-center gap-3">
                        <div class="flex items-center gap-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-4 w-4 text-green-500"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span class="text-xs text-green-500">Connected</span>
                        </div>
                        <button
                          (click)="handleDisconnect(source.id)"
                          class="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  }
                </div>
                <div class="mt-4 pt-4 border-t border-border">
                  <p class="text-sm text-muted-foreground">
                    <span class="font-medium text-foreground"
                      >{{ connectedSources().length }} of
                      {{ limitLabel() }}</span
                    >
                    data sources used on your current plan
                  </p>
                </div>
              }
            </div>
          </div>

          <div class="rounded-lg border border-border bg-card">
            <div class="p-4 border-b border-border">
              <h3 class="text-lg font-semibold">Add Data Source</h3>
              <p class="text-sm text-muted-foreground mt-1">
                Connect additional data sources to power your dashboards
              </p>
            </div>
            <div class="p-4">
              <div class="grid grid-cols-2 gap-3">
                @for (source of sourcesAvailableToAdd(); track source.name) {
                  <div
                    class="flex items-center justify-between p-3 rounded-lg border border-border hover:border-accent/50 transition-colors"
                  >
                    <div class="flex items-center gap-3">
                      <span class="text-xl">{{ source.icon }}</span>
                      <div>
                        <p class="text-sm font-medium">{{ source.name }}</p>
                        <p class="text-xs text-muted-foreground">
                          {{ source.type }}
                        </p>
                      </div>
                    </div>
                    <button
                      (click)="handleConnect(source)"
                      [disabled]="atLimit() || connectingName() === source.name"
                      class="inline-flex items-center gap-1 rounded-md bg-primary text-primary-foreground text-sm font-medium h-8 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +
                      {{
                        connectingName() === source.name
                          ? 'Connecting...'
                          : 'Connect'
                      }}
                    </button>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
})
export class DataSourcesComponent implements OnInit {
  private schematic = inject(SchematicService);
  private api = inject(SchematicApiService);

  // Signal pattern
  entitlement = toSignal(this.schematic.entitlement$('data-sources'));

  connectedSources = signal<DataSource[]>([]);
  isLoading = signal(true);
  connectingName = signal<string | null>(null);

  availableSources: AvailableSource[] = [
    { name: 'Snowflake', type: 'Data Warehouse', icon: '\u2744\uFE0F' },
    { name: 'BigQuery', type: 'Data Warehouse', icon: '\uD83D\uDCCA' },
    { name: 'MySQL', type: 'Database', icon: '\uD83D\uDC2C' },
    { name: 'MongoDB', type: 'Database', icon: '\uD83C\uDF43' },
    { name: 'Salesforce', type: 'CRM', icon: '\u2601\uFE0F' },
    { name: 'Stripe', type: 'Payments', icon: '\uD83D\uDCB3' },
    { name: 'Google Analytics', type: 'Analytics', icon: '\uD83D\uDCC8' },
    { name: 'Mixpanel', type: 'Analytics', icon: '\uD83D\uDCC9' },
  ];

  atLimit(): boolean {
    const ent = this.entitlement();
    if (!ent) return false;
    const allocation = ent.featureAllocation;
    return (
      allocation != null && this.connectedSources().length >= allocation
    );
  }

  limitLabel(): string {
    const ent = this.entitlement();
    return ent?.featureAllocation != null
      ? String(ent.featureAllocation)
      : '\u2014';
  }

  sourcesAvailableToAdd(): AvailableSource[] {
    const connectedNames = new Set(this.connectedSources().map((s) => s.name));
    return this.availableSources.filter((s) => !connectedNames.has(s.name));
  }

  ngOnInit(): void {
    this.api.getDataSources().subscribe({
      next: (sources) => {
        this.connectedSources.set(sources);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching data sources:', err);
        this.isLoading.set(false);
      },
    });
  }

  handleConnect(source: AvailableSource): void {
    if (this.atLimit()) return;

    this.connectingName.set(source.name);
    this.api
      .addDataSource({
        name: source.name,
        type: source.type,
        icon: source.icon,
      })
      .subscribe({
        next: (added) => {
          this.connectedSources.update((sources) => [...sources, added]);
          this.connectingName.set(null);
        },
        error: (err) => {
          console.error('Error connecting data source:', err);
          alert(err.error?.message || 'Failed to connect');
          this.connectingName.set(null);
        },
      });
  }

  handleDisconnect(id: string): void {
    if (!confirm('Remove this data source?')) return;

    this.api.deleteDataSource(id).subscribe({
      next: () => {
        this.connectedSources.update((sources) => sources.filter((s) => s.id !== id));
      },
      error: (err) => {
        console.error('Error removing data source:', err);
        alert(err.error?.message || 'Failed to remove');
      },
    });
  }
}
