<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Database, Plus, Check, Trash2, AlertCircle, ArrowUp } from 'lucide-vue-next'
import { useSchematicEntitlement, useSchematicIsPending } from '@schematichq/schematic-vue'
import {
  getDataSources,
  addDataSource,
  deleteDataSource,
  type DataSource,
} from '@/composables/useApi'

const connectedSources = ref<DataSource[]>([])
const isLoading = ref(true)
const connectingName = ref<string | null>(null)

const { featureAllocation: allocation } = useSchematicEntitlement('data-sources')
const isPending = useSchematicIsPending()

const atLimit = computed(
  () => allocation.value != null && connectedSources.value.length >= allocation.value,
)
const limitLabel = computed(() =>
  allocation.value != null ? String(allocation.value) : '\u2014',
)

const availableSources = [
  { name: 'Snowflake', type: 'Data Warehouse', icon: '\u2744\uFE0F' },
  { name: 'BigQuery', type: 'Data Warehouse', icon: '\uD83D\uDCCA' },
  { name: 'MySQL', type: 'Database', icon: '\uD83D\uDC2C' },
  { name: 'MongoDB', type: 'Database', icon: '\uD83C\uDF43' },
  { name: 'Salesforce', type: 'CRM', icon: '\u2601\uFE0F' },
  { name: 'Stripe', type: 'Payments', icon: '\uD83D\uDCB3' },
  { name: 'Google Analytics', type: 'Analytics', icon: '\uD83D\uDCC8' },
  { name: 'Mixpanel', type: 'Analytics', icon: '\uD83D\uDCC9' },
]

const connectedNames = computed(() => new Set(connectedSources.value.map((s) => s.name)))
const sourcesAvailableToAdd = computed(() =>
  availableSources.filter((s) => !connectedNames.value.has(s.name)),
)

onMounted(async () => {
  try {
    connectedSources.value = await getDataSources()
  } catch (e) {
    console.error('Error fetching data sources:', e)
  } finally {
    isLoading.value = false
  }
})

async function handleConnect(source: (typeof availableSources)[0]) {
  if (atLimit.value) return
  connectingName.value = source.name
  try {
    const added = await addDataSource({
      name: source.name,
      type: source.type,
      icon: source.icon,
    })
    connectedSources.value.push(added)
  } catch (e: any) {
    alert(e.message || 'Failed to connect')
  } finally {
    connectingName.value = null
  }
}

async function handleDisconnect(id: string) {
  if (!confirm('Remove this data source?')) return
  try {
    await deleteDataSource(id)
    connectedSources.value = connectedSources.value.filter((s) => s.id !== id)
  } catch (e: any) {
    alert(e.message || 'Failed to remove')
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <main class="flex-1 p-6">
      <div class="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 class="text-2xl font-bold mb-1">Data Sources</h1>
          <p class="text-muted-foreground">Connect and manage your data sources</p>
        </div>

        <!-- Upgrade banner -->
        <div
          v-if="!isPending && atLimit"
          class="rounded-lg border border-violet-800/80 bg-violet-950/40 p-4 flex items-center justify-between"
        >
          <div class="flex items-center gap-3">
            <AlertCircle :size="20" class="text-violet-400 shrink-0" />
            <div>
              <p class="text-sm font-medium text-violet-100">Data source limit reached</p>
              <p class="text-xs text-violet-300">Upgrade your plan to connect more data sources</p>
            </div>
          </div>
          <RouterLink to="/pricing">
            <button class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-violet-600 hover:bg-violet-700 text-white shrink-0 transition-colors">
              <ArrowUp :size="16" />
              Upgrade
            </button>
          </RouterLink>
        </div>

        <!-- Connected sources card -->
        <div class="rounded-lg border border-border bg-card">
          <div class="p-6 pb-4">
            <div class="flex items-center gap-2">
              <Database :size="20" class="text-accent" />
              <h3 class="text-lg font-semibold">Connected Sources</h3>
            </div>
            <p class="text-sm text-muted-foreground mt-1">
              Data sources currently integrated with your dashboards
            </p>
          </div>
          <div class="px-6 pb-6">
            <p v-if="isLoading" class="text-sm text-muted-foreground">Loading...</p>
            <template v-else>
              <div class="space-y-3">
                <div
                  v-for="source in connectedSources"
                  :key="source.id"
                  class="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                >
                  <div class="flex items-center gap-3">
                    <span class="text-xl">{{ source.icon }}</span>
                    <div>
                      <p class="text-sm font-medium">{{ source.name }}</p>
                      <p class="text-xs text-muted-foreground">{{ source.type }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="flex items-center gap-1">
                      <Check :size="16" class="text-green-500" />
                      <span class="text-xs text-green-500">Connected</span>
                    </div>
                    <button
                      class="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground rounded transition-colors"
                      @click="handleDisconnect(source.id)"
                    >
                      <Trash2 :size="12" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
              <div v-if="!isPending" class="mt-4 pt-4 border-t border-border">
                <p class="text-sm text-muted-foreground">
                  <span class="font-medium text-foreground">{{ connectedSources.length }} of {{ limitLabel }}</span>
                  data sources used on your current plan
                </p>
              </div>
            </template>
          </div>
        </div>

        <!-- Add data source card -->
        <div class="rounded-lg border border-border bg-card">
          <div class="p-6 pb-4">
            <h3 class="text-lg font-semibold">Add Data Source</h3>
            <p class="text-sm text-muted-foreground mt-1">
              Connect additional data sources to power your dashboards
            </p>
          </div>
          <div class="px-6 pb-6">
            <div class="grid grid-cols-2 gap-3">
              <div
                v-for="source in sourcesAvailableToAdd"
                :key="source.name"
                class="flex items-center justify-between p-3 rounded-lg border border-border hover:border-accent/50 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <span class="text-xl">{{ source.icon }}</span>
                  <div>
                    <p class="text-sm font-medium">{{ source.name }}</p>
                    <p class="text-xs text-muted-foreground">{{ source.type }}</p>
                  </div>
                </div>
                <button
                  :disabled="atLimit || connectingName === source.name"
                  :class="[
                    'flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors',
                    !atLimit && connectingName !== source.name
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-secondary text-secondary-foreground opacity-60 cursor-not-allowed',
                  ]"
                  @click="handleConnect(source)"
                >
                  <Plus :size="12" />
                  {{ connectingName === source.name ? 'Connecting...' : 'Connect' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
