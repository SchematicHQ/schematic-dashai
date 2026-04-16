import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { SchematicService } from '@schematichq/schematic-angular';
import { CreditsBadgeComponent } from '../credits-badge/credits-badge.component';

@Component({
  selector: 'app-header',
  imports: [RouterLink, AsyncPipe, CreditsBadgeComponent],
  template: `
    <header class="border-b border-border">
      <div class="flex items-center justify-between px-6 py-4">
        <div class="flex items-center gap-8">
          <a routerLink="/" class="flex items-center gap-2">
            <div
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-accent"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4 text-accent-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
                />
              </svg>
            </div>
            <span class="text-lg font-semibold">DashAI</span>
          </a>
          <nav class="flex items-center gap-6">
            <a
              routerLink="/"
              class="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Builder
            </a>
            <a
              routerLink="/team"
              class="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Team
            </a>
            <a
              routerLink="/data-sources"
              class="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
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
              Data Sources
            </a>
          </nav>
        </div>
        <div class="flex items-center gap-4">
          <!-- MIXED PATTERN: credits-badge uses Observable, plan uses Signal -->
          <app-credits-badge />

          <!-- Signal pattern: plan$ converted to signal for demonstration -->
          @if (plan()) {
            <span class="text-xs text-muted-foreground font-mono">
              Plan: {{ plan()?.name }}
            </span>
          }

          <!-- Observable pattern: isPending$ with async pipe -->
          @if (isPending$ | async) {
            <span class="text-xs text-muted-foreground animate-pulse"
              >Loading...</span
            >
          }

          <a routerLink="/pricing">
            <button
              class="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              Pricing
            </button>
          </a>
          <a routerLink="/plan">
            <button
              class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium h-9 px-3 border border-border bg-transparent hover:bg-muted/50 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <line x1="2" x2="22" y1="10" y2="10" />
              </svg>
              Plan
            </button>
          </a>
        </div>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  private schematic = inject(SchematicService);

  // Signal pattern for plan
  plan = toSignal(this.schematic.plan$());

  // Observable pattern for isPending
  isPending$ = this.schematic.isPending$();
}
