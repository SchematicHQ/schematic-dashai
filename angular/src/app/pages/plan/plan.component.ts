import { Component, inject, OnInit, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { SchematicService } from '@schematichq/schematic-angular';
import { SchematicApiService } from '../../services/schematic-api.service';
import { SchematicEmbedComponent } from '../../components/schematic-embed/schematic-embed.component';
import { environment } from '../../../environments/environment.development';

/**
 * OBSERVABLE PATTERN: Uses isPending$ with async pipe for loading state.
 * Local state uses signals for zoneless change detection.
 */
@Component({
  selector: 'app-plan',
  imports: [AsyncPipe, SchematicEmbedComponent],
  template: `
    <div class="min-h-screen bg-background">
      <div class="container mx-auto px-6 py-4">
        <h1 class="text-2xl font-bold mb-4">Usage & Plan</h1>

        @if (isLoading()) {
          <p class="text-muted-foreground">Loading...</p>
        } @else if (error()) {
          <p class="text-destructive">{{ error() }}</p>
        } @else if (accessToken()) {
          <!-- Observable pattern: show isPending from Schematic SDK -->
          @if (isPending$ | async) {
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
export class PlanComponent implements OnInit {
  private api = inject(SchematicApiService);
  private schematic = inject(SchematicService);

  isPending$ = this.schematic.isPending$();

  accessToken = signal<string | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  componentId = environment.schematicComponentId;

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
