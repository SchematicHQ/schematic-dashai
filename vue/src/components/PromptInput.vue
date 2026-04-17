<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowUp, Sparkles, Brain, TrendingUp, Zap } from 'lucide-vue-next'
import { useSchematicEvents } from '@schematichq/schematic-vue'

const prompt = ref('')
const isGenerating = ref(false)
const predictiveAnalytics = ref(false)
const anomalyDetection = ref(false)
const autoInsights = ref(true)
const selectedModel = ref('gpt-4')

const router = useRouter()
const { track } = useSchematicEvents()

function handleSubmit() {
  if (!prompt.value.trim()) return
  isGenerating.value = true

  track({
    event: 'dashboard-prompt',
    quantity: Math.floor(Math.random() * 101) + 50,
  })

  setTimeout(() => {
    router.push('/dashboard')
  }, 2000)
}

function setPrompt(text: string) {
  prompt.value = text
}
</script>

<template>
  <div class="w-full max-w-3xl mx-auto">
    <div class="rounded-xl border border-border bg-card p-4">
      <textarea
        v-model="prompt"
        placeholder="Describe the dashboard you want to build..."
        class="min-h-[120px] w-full resize-none border-0 bg-transparent p-0 text-base focus:outline-none placeholder:text-muted-foreground"
        @keydown.enter.exact.prevent="handleSubmit"
      />
      <div class="flex items-center justify-between pt-4 border-t border-border mt-4">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="text-xs text-muted-foreground">Model</span>
            <select
              v-model="selectedModel"
              class="h-8 w-[140px] text-xs rounded-md border border-border bg-background px-2 focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="gpt-4">GPT-4 Turbo</option>
              <option value="gpt-3.5">GPT-3.5</option>
              <option value="claude">Claude 3</option>
              <option value="gemini">Gemini Pro</option>
            </select>
          </div>
          <button
            :class="[
              'flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md transition-colors',
              predictiveAnalytics
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-muted',
            ]"
            @click="predictiveAnalytics = !predictiveAnalytics"
          >
            <TrendingUp :size="14" />
            Predictive
          </button>
          <button
            :class="[
              'flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md transition-colors',
              anomalyDetection
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-muted',
            ]"
            @click="anomalyDetection = !anomalyDetection"
          >
            <Zap :size="14" />
            Anomaly Detection
          </button>
          <button
            :class="[
              'flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md transition-colors',
              autoInsights
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-muted',
            ]"
            @click="autoInsights = !autoInsights"
          >
            <Brain :size="14" />
            Auto-Insights
          </button>
        </div>
        <button
          :disabled="!prompt.trim() || isGenerating"
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          @click="handleSubmit"
        >
          <template v-if="isGenerating">
            <Sparkles :size="16" class="animate-pulse" />
            Generating...
          </template>
          <template v-else>
            Generate
            <ArrowUp :size="16" />
          </template>
        </button>
      </div>
    </div>
    <div class="flex items-center justify-center gap-2 mt-4">
      <span class="text-xs text-muted-foreground">Try:</span>
      <button
        class="text-xs text-accent hover:underline"
        @click="setPrompt('Sales performance dashboard with revenue trends')"
      >
        Sales dashboard
      </button>
      <span class="text-muted-foreground">&middot;</span>
      <button
        class="text-xs text-accent hover:underline"
        @click="setPrompt('User analytics with engagement metrics')"
      >
        User analytics
      </button>
      <span class="text-muted-foreground">&middot;</span>
      <button
        class="text-xs text-accent hover:underline"
        @click="setPrompt('Marketing campaign performance overview')"
      >
        Marketing metrics
      </button>
    </div>
  </div>
</template>
