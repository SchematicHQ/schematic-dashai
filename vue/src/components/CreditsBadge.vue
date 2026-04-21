<script setup lang="ts">
import { useSchematicEntitlement, useSchematicIsPending } from '@schematichq/schematic-vue'

const isPending = useSchematicIsPending()
const { check } = useSchematicEntitlement('dashboard-prompt')
</script>

<template>
  <div
    v-if="!isPending && check.creditRemaining != null"
    class="inline-flex items-center rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground"
  >
    <span class="mr-1 h-2 w-2 rounded-full bg-emerald-500" />
    <span>{{ check.creditRemaining.toLocaleString() }} credits remaining</span>
  </div>
</template>
