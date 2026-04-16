import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { SchematicService } from '@schematichq/schematic-angular';

/**
 * SIGNAL PATTERN: Uses toSignal() to convert the entitlement$ observable
 * to a signal for template usage.
 */
@Component({
  selector: 'app-prompt-input',
  imports: [FormsModule],
  template: `
    <div class="w-full max-w-3xl mx-auto">
      <div class="rounded-xl border border-border bg-card p-4">
        <textarea
          class="min-h-[120px] w-full resize-none border-0 bg-transparent p-0 text-base focus:outline-none placeholder:text-muted-foreground"
          placeholder="Describe the dashboard you want to build..."
          [(ngModel)]="prompt"
          (keydown.enter)="onEnter($event)"
        ></textarea>
        <div
          class="flex items-center justify-between pt-4 border-t border-border mt-4"
        >
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <span class="text-xs text-muted-foreground">Model</span>
              <select
                class="h-8 w-[140px] text-xs rounded-md border border-border bg-background px-2"
                [(ngModel)]="selectedModel"
              >
                <option value="gpt-4">GPT-4 Turbo</option>
                <option value="gpt-3.5">GPT-3.5</option>
                <option value="claude">Claude 3</option>
                <option value="gemini">Gemini Pro</option>
              </select>
            </div>
            <button
              (click)="predictiveAnalytics = !predictiveAnalytics"
              class="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-border transition-colors"
              [class.bg-accent]="predictiveAnalytics"
              [class.text-accent-foreground]="predictiveAnalytics"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
              Predictive
            </button>
            <button
              (click)="anomalyDetection = !anomalyDetection"
              class="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-border transition-colors"
              [class.bg-accent]="anomalyDetection"
              [class.text-accent-foreground]="anomalyDetection"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"
                />
              </svg>
              Anomaly Detection
            </button>
            <button
              (click)="autoInsights = !autoInsights"
              class="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-border transition-colors"
              [class.bg-accent]="autoInsights"
              [class.text-accent-foreground]="autoInsights"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
                <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
                <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
                <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
                <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
                <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
                <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
                <path d="M6 18a4 4 0 0 1-1.967-.516" />
                <path d="M19.967 17.484A4 4 0 0 1 18 18" />
              </svg>
              Auto-Insights
            </button>
          </div>
          <button
            (click)="handleSubmit()"
            [disabled]="!prompt.trim() || isGenerating"
            class="inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-medium h-10 px-4 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            @if (isGenerating) {
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4 animate-pulse"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
                />
              </svg>
              Generating...
            } @else {
              Generate
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
                <path d="m5 12 7-7 7 7" />
                <path d="M12 19V5" />
              </svg>
            }
          </button>
        </div>
      </div>
      <div class="flex items-center justify-center gap-2 mt-4">
        <span class="text-xs text-muted-foreground">Try:</span>
        <button
          (click)="prompt = 'Sales performance dashboard with revenue trends'"
          class="text-xs text-accent hover:underline"
        >
          Sales dashboard
        </button>
        <span class="text-muted-foreground">.</span>
        <button
          (click)="prompt = 'User analytics with engagement metrics'"
          class="text-xs text-accent hover:underline"
        >
          User analytics
        </button>
        <span class="text-muted-foreground">.</span>
        <button
          (click)="prompt = 'Marketing campaign performance overview'"
          class="text-xs text-accent hover:underline"
        >
          Marketing metrics
        </button>
      </div>
    </div>
  `,
})
export class PromptInputComponent {
  private router = inject(Router);
  private schematic = inject(SchematicService);

  // Signal pattern: entitlement as a signal
  entitlement = toSignal(this.schematic.entitlement$('dashboard-prompt'));

  prompt = '';
  selectedModel = 'gpt-4';
  predictiveAnalytics = false;
  anomalyDetection = false;
  autoInsights = true;
  isGenerating = false;

  handleSubmit(): void {
    if (!this.prompt.trim()) return;

    this.isGenerating = true;

    this.schematic.track({
      event: 'dashboard-prompt',
      quantity: Math.floor(Math.random() * 101) + 50,
    });

    setTimeout(() => {
      this.router.navigate(['/dashboard']);
    }, 2000);
  }

  onEnter(event: Event): void {
    const ke = event as KeyboardEvent;
    if (!ke.shiftKey) {
      ke.preventDefault();
      this.handleSubmit();
    }
  }
}
