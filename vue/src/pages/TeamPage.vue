<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus, Trash2, X, AlertCircle, ArrowUp } from 'lucide-vue-next'
import { useSchematicEntitlement, useSchematicIsPending } from '@schematichq/schematic-vue'
import { getUsers, addUser, deleteUser, type TeamMember } from '@/composables/useApi'

const teamMembers = ref<TeamMember[]>([])
const isLoading = ref(true)
const showAddForm = ref(false)
const isSubmitting = ref(false)
const newMember = reactive({ name: '', email: '', role: 'Viewer' })

const { value: seatEnabled, featureAllocation: allocation, featureUsage: usage } =
  useSchematicEntitlement('user-seat')
const isPending = useSchematicIsPending()

onMounted(async () => {
  try {
    teamMembers.value = await getUsers()
  } catch (e) {
    console.error('Error fetching users:', e)
  } finally {
    isLoading.value = false
  }
})

async function handleAddMember() {
  if (!newMember.name || !newMember.email) return
  isSubmitting.value = true
  try {
    const added = await addUser({
      name: newMember.name,
      email: newMember.email,
      role: newMember.role,
    })
    teamMembers.value.push(added)
    newMember.name = ''
    newMember.email = ''
    newMember.role = 'Viewer'
    showAddForm.value = false
  } catch (e: any) {
    alert(e.message || 'Failed to add member')
  } finally {
    isSubmitting.value = false
  }
}

async function handleDeleteMember(id: string) {
  if (!confirm('Are you sure you want to remove this team member?')) return
  try {
    await deleteUser(id)
    teamMembers.value = teamMembers.value.filter((m) => m.id !== id)
  } catch (e: any) {
    alert(e.message || 'Failed to delete member')
  }
}

function closeForm() {
  showAddForm.value = false
  newMember.name = ''
  newMember.email = ''
  newMember.role = 'Viewer'
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <main class="flex-1 p-6">
      <div class="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 class="text-2xl font-bold mb-1">Team</h1>
          <p class="text-muted-foreground">Manage who has access to your dashboards</p>
        </div>

        <!-- Upgrade banner -->
        <div
          v-if="!isPending && seatEnabled === false"
          class="rounded-lg border border-violet-800/80 bg-violet-950/40 p-4 flex items-center justify-between"
        >
          <div class="flex items-center gap-3">
            <AlertCircle :size="20" class="text-violet-400 shrink-0" />
            <div>
              <p class="text-sm font-medium text-violet-100">Seat limit reached</p>
              <p class="text-xs text-violet-300">Upgrade your plan to add more team members</p>
            </div>
          </div>
          <RouterLink to="/pricing">
            <button class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-violet-600 hover:bg-violet-700 text-white shrink-0 transition-colors">
              <ArrowUp :size="16" />
              Upgrade
            </button>
          </RouterLink>
        </div>

        <!-- Team members card -->
        <div class="rounded-lg border border-border bg-card">
          <div class="flex items-center justify-between p-6 pb-4">
            <div>
              <h3 class="text-lg font-semibold">Team Members</h3>
              <p class="text-sm text-muted-foreground">Invite and manage your team</p>
            </div>
            <button
              v-if="!showAddForm"
              :disabled="seatEnabled === false"
              :title="seatEnabled === false ? 'Seat limit reached' : 'Invite a new team member'"
              class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              @click="showAddForm = true"
            >
              <Plus :size="16" />
              Invite Member
            </button>
          </div>
          <div class="px-6 pb-6">
            <!-- Add form -->
            <div v-if="showAddForm" class="mb-4 p-4 rounded-lg border border-border bg-muted/50">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-medium">Add Team Member</h3>
                <button
                  class="p-1 rounded hover:bg-muted transition-colors"
                  @click="closeForm"
                >
                  <X :size="16" />
                </button>
              </div>
              <div class="space-y-3">
                <input
                  v-model="newMember.name"
                  type="text"
                  placeholder="Name"
                  class="w-full px-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <input
                  v-model="newMember.email"
                  type="email"
                  placeholder="Email"
                  class="w-full px-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <select
                  v-model="newMember.role"
                  class="w-full px-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="Admin">Admin</option>
                  <option value="Editor">Editor</option>
                  <option value="Viewer">Viewer</option>
                </select>
                <div class="flex gap-2">
                  <button
                    :disabled="isSubmitting || !newMember.name || !newMember.email"
                    class="flex-1 px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    @click="handleAddMember"
                  >
                    {{ isSubmitting ? 'Adding...' : 'Add Member' }}
                  </button>
                  <button
                    class="px-3 py-2 text-sm rounded-md border border-border hover:bg-muted transition-colors"
                    @click="closeForm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>

            <!-- Members list -->
            <div class="space-y-4">
              <p v-if="isLoading" class="text-sm text-muted-foreground">Loading team members...</p>
              <p v-else-if="teamMembers.length === 0" class="text-sm text-muted-foreground">
                No team members yet. Add one to get started.
              </p>
              <div
                v-for="member in teamMembers"
                v-else
                :key="member.id"
                class="flex items-center justify-between p-3 rounded-lg border border-border"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="h-9 w-9 rounded-full bg-accent text-accent-foreground text-sm flex items-center justify-center font-medium"
                  >
                    {{ member.initials }}
                  </div>
                  <div>
                    <p class="text-sm font-medium">{{ member.name }}</p>
                    <p class="text-xs text-muted-foreground">{{ member.email }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <span class="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
                    {{ member.role }}
                  </span>
                  <button
                    class="p-2 rounded-md text-muted-foreground hover:text-destructive transition-colors"
                    @click="handleDeleteMember(member.id)"
                  >
                    <Trash2 :size="16" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Seat count -->
            <div v-if="!isPending" class="mt-4 pt-4 border-t border-border">
              <p class="text-sm text-muted-foreground">
                <span class="font-medium text-foreground">{{ usage }} of {{ allocation }}</span>
                seats used on your current plan
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
