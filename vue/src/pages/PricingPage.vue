<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSchematicIsPending } from '@schematichq/schematic-vue'
import { getAccessToken } from '@/composables/useApi'
import SchematicEmbed from '@/components/SchematicEmbed.vue'

const accessToken = ref<string | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)
const componentId = import.meta.env.VITE_SCHEMATIC_PRICING_TABLE_ID || null
const isPending = useSchematicIsPending()

onMounted(async () => {
  try {
    const result = await getAccessToken()
    accessToken.value = result.accessToken
  } catch (e) {
    console.error(e)
    error.value = 'Error fetching data'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <div class="container mx-auto px-6 py-4">
      <h1 class="text-2xl font-bold mb-4">Pricing</h1>

      <div v-if="!componentId">Not found</div>
      <div v-else-if="isLoading">Loading...</div>
      <p v-else-if="error">{{ error }}</p>
      <template v-else-if="accessToken">
        <p v-if="isPending" class="text-muted-foreground animate-pulse mb-2">
          Schematic SDK loading...
        </p>
        <SchematicEmbed :access-token="accessToken" :component-id="componentId" />
      </template>
    </div>
  </div>
</template>
