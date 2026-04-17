import { Component, inject, OnInit, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SchematicService, CheckFlagReturn } from '@schematichq/schematic-angular';
import { Observable } from 'rxjs';
import {
  SchematicApiService,
  TeamMember,
} from '../../services/schematic-api.service';

/**
 * OBSERVABLE PATTERN: Uses async pipe for the user-seat entitlement.
 */
@Component({
  selector: 'app-team',
  imports: [AsyncPipe, FormsModule],
  template: `
    <div class="min-h-screen flex flex-col">
      <main class="flex-1 p-6">
        <div class="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 class="text-2xl font-bold mb-1">Team</h1>
            <p class="text-muted-foreground">
              Manage who has access to your dashboards
            </p>
          </div>

          @if (entitlement$ | async; as ent) {
            @if (!(isPending$ | async) && ent.value === false) {
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
                      Seat limit reached
                    </p>
                    <p class="text-xs text-violet-300">
                      Upgrade your plan to add more team members
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
              <div class="flex items-center justify-between p-4 border-b border-border">
                <div>
                  <h3 class="text-lg font-semibold">Team Members</h3>
                  <p class="text-sm text-muted-foreground">
                    Invite and manage your team
                  </p>
                </div>
                @if (!showAddForm()) {
                  <button
                    (click)="showAddForm.set(true)"
                    [disabled]="ent.value === false"
                    class="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-medium h-9 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    [title]="
                      ent.value === false
                        ? 'Seat limit reached'
                        : 'Invite a new team member'
                    "
                  >
                    + Invite Member
                  </button>
                }
              </div>
              <div class="p-4">
                @if (showAddForm()) {
                  <div class="mb-4 p-4 rounded-lg border border-border bg-muted/50">
                    <div class="flex items-center justify-between mb-4">
                      <h3 class="text-sm font-medium">Add Team Member</h3>
                      <button
                        (click)="cancelAdd()"
                        class="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-muted"
                      >
                        X
                      </button>
                    </div>
                    <div class="space-y-3">
                      <input
                        type="text"
                        placeholder="Name"
                        [(ngModel)]="newMember.name"
                        class="w-full px-3 py-2 text-sm rounded-md border border-border bg-background"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        [(ngModel)]="newMember.email"
                        class="w-full px-3 py-2 text-sm rounded-md border border-border bg-background"
                      />
                      <select
                        [(ngModel)]="newMember.role"
                        class="w-full px-3 py-2 text-sm rounded-md border border-border bg-background"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Editor">Editor</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                      <div class="flex gap-2">
                        <button
                          (click)="handleAddMember()"
                          [disabled]="
                            isSubmitting() || !newMember.name || !newMember.email
                          "
                          class="flex-1 inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-medium h-9 px-3 disabled:opacity-50"
                        >
                          {{ isSubmitting() ? 'Adding...' : 'Add Member' }}
                        </button>
                        <button
                          (click)="cancelAdd()"
                          class="inline-flex items-center justify-center rounded-md border border-border text-sm font-medium h-9 px-3 hover:bg-muted/50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                }

                <div class="space-y-4">
                  @if (isLoading()) {
                    <p class="text-sm text-muted-foreground">
                      Loading team members...
                    </p>
                  } @else if (teamMembers().length === 0) {
                    <p class="text-sm text-muted-foreground">
                      No team members yet. Add one to get started.
                    </p>
                  } @else {
                    @for (member of teamMembers(); track member.id) {
                      <div
                        class="flex items-center justify-between p-3 rounded-lg border border-border"
                      >
                        <div class="flex items-center gap-3">
                          <div
                            class="h-9 w-9 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-sm font-medium"
                          >
                            {{ member.initials }}
                          </div>
                          <div>
                            <p class="text-sm font-medium">{{ member.name }}</p>
                            <p class="text-xs text-muted-foreground">
                              {{ member.email }}
                            </p>
                          </div>
                        </div>
                        <div class="flex items-center gap-3">
                          <span
                            class="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                          >
                            {{ member.role }}
                          </span>
                          <button
                            (click)="handleDeleteMember(member.id)"
                            class="h-8 w-8 inline-flex items-center justify-center rounded text-muted-foreground hover:text-destructive"
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
                              <path d="M3 6h18" />
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    }
                  }
                </div>
                @if (!(isPending$ | async)) {
                  <div class="mt-4 pt-4 border-t border-border">
                    <p class="text-sm text-muted-foreground">
                      <span class="font-medium text-foreground"
                        >{{ ent.featureUsage }} of
                        {{ ent.featureAllocation }}</span
                      >
                      seats used on your current plan
                    </p>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </main>
    </div>
  `,
})
export class TeamComponent implements OnInit {
  private schematic = inject(SchematicService);
  private api = inject(SchematicApiService);

  // Observable pattern: entitlement via async pipe
  entitlement$: Observable<CheckFlagReturn> =
    this.schematic.entitlement$('user-seat');
  isPending$ = this.schematic.isPending$();

  teamMembers = signal<TeamMember[]>([]);
  isLoading = signal(true);
  showAddForm = signal(false);
  isSubmitting = signal(false);
  newMember = { name: '', email: '', role: 'Viewer' };

  ngOnInit(): void {
    this.api.getUsers().subscribe({
      next: (users) => {
        this.teamMembers.set(users);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching users:', err);
        this.isLoading.set(false);
      },
    });
  }

  handleAddMember(): void {
    if (!this.newMember.name || !this.newMember.email) return;

    this.isSubmitting.set(true);
    this.api.addUser(this.newMember).subscribe({
      next: (user) => {
        this.teamMembers.update((members) => [...members, user]);
        this.cancelAdd();
        this.isSubmitting.set(false);
      },
      error: (err) => {
        console.error('Error adding member:', err);
        alert(err.error?.message || 'Failed to add member');
        this.isSubmitting.set(false);
      },
    });
  }

  handleDeleteMember(id: string): void {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    this.api.deleteUser(id).subscribe({
      next: () => {
        this.teamMembers.update((members) => members.filter((m) => m.id !== id));
      },
      error: (err) => {
        console.error('Error deleting member:', err);
        alert(err.error?.message || 'Failed to delete member');
      },
    });
  }

  cancelAdd(): void {
    this.showAddForm.set(false);
    this.newMember = { name: '', email: '', role: 'Viewer' };
  }
}
