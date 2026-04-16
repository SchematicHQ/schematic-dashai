import { Component } from '@angular/core';
import { PromptInputComponent } from '../../components/prompt-input/prompt-input.component';

@Component({
  selector: 'app-home',
  imports: [PromptInputComponent],
  template: `
    <div class="min-h-screen flex flex-col">
      <main class="flex-1 p-6">
        <div
          class="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]"
        >
          <div class="text-center mb-8">
            <h1 class="text-4xl font-bold tracking-tight mb-2">
              Build dashboards with AI
            </h1>
            <p class="text-muted-foreground text-lg">
              Describe what you need and we'll generate it instantly
            </p>
          </div>
          <app-prompt-input />
        </div>
      </main>
    </div>
  `,
})
export class HomeComponent {}
