<script setup lang="ts">
import { onMounted } from 'vue'
import { useSchematicEvents } from '@schematichq/schematic-vue'
import AppHeader from '@/components/AppHeader.vue'

const { identify } = useSchematicEvents()

onMounted(() => {
  identify({
    keys: { id: 'demo-user', email: 'demo@example.com' },
    name: 'Demo User',
    company: { keys: { id: 'demo' } },
  })
})
</script>

<template>
  <AppHeader />
  <RouterView />
</template>
