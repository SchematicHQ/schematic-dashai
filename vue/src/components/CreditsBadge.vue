<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getCreditBalance, type CreditBalance } from '@/composables/useApi'

const balance = ref<CreditBalance | null>(null)
const isLoading = ref(true)

onMounted(async () => {
  try {
    balance.value = await getCreditBalance()
  } catch (e) {
    console.error(e)
  } finally {
    isLoading.value = false
  }
})

const remaining = computed(() =>
  balance.value
    ? Math.max(0, (balance.value.allocation ?? 0) - (balance.value.usage ?? 0))
    : 0,
)
</script>

<template>
  <div
    v-if="!isLoading && balance"
    class="inline-flex items-center rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground"
  >
    <span class="mr-1 h-2 w-2 rounded-full bg-emerald-500" />
    <span>{{ remaining.toLocaleString() }} credits remaining</span>
  </div>
</template>
