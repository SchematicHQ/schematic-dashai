<script setup lang="ts">
import { Sparkles, Users, Database, CreditCard } from 'lucide-vue-next'
import { useSchematicIsPending } from '@schematichq/schematic-vue'
import CreditsBadge from '@/components/CreditsBadge.vue'

const isPending = useSchematicIsPending()
</script>

<template>
  <header class="border-b border-border">
    <div class="flex items-center justify-between px-6 py-4">
      <div class="flex items-center gap-8">
        <RouterLink to="/" class="flex items-center gap-2">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
            <Sparkles :size="16" class="text-accent-foreground" />
          </div>
          <span class="text-lg font-semibold">DashAI</span>
        </RouterLink>
        <nav class="flex items-center gap-6">
          <RouterLink to="/" class="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Builder
          </RouterLink>
          <RouterLink
            to="/team"
            class="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Users :size="16" />
            Team
          </RouterLink>
          <RouterLink
            to="/data-sources"
            class="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Database :size="16" />
            Data Sources
          </RouterLink>
        </nav>
      </div>
      <div class="flex items-center gap-4">
        <span v-if="isPending" class="text-xs text-muted-foreground animate-pulse">
          Loading...
        </span>
        <CreditsBadge />
        <RouterLink to="/pricing">
          <button class="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
            Pricing
          </button>
        </RouterLink>
        <RouterLink to="/plan">
          <button class="flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-md bg-transparent hover:bg-muted transition-colors">
            <CreditCard :size="16" />
            Plan
          </button>
        </RouterLink>
      </div>
    </div>
  </header>
</template>
