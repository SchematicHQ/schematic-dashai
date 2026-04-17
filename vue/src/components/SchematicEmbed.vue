<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps<{
  accessToken: string | null
  componentId: string | null
}>()

const containerRef = ref<HTMLDivElement | null>(null)

let root: any = null
let React: any = null
let ReactDOM: any = null
let SchematicComponents: any = null
let loaded = false

async function loadReact() {
  try {
    React = await import('react')
    ReactDOM = await import('react-dom/client')
    SchematicComponents = await import('@schematichq/schematic-components')
    loaded = true
  } catch (err) {
    console.error('Failed to load React dependencies for embed:', err)
  }
}

function renderEmbed() {
  if (!loaded || !props.accessToken || !props.componentId || !containerRef.value) {
    return
  }

  const { createElement } = React
  const { EmbedProvider, SchematicEmbed } = SchematicComponents

  const element = createElement(
    EmbedProvider,
    {},
    createElement(SchematicEmbed, {
      accessToken: props.accessToken,
      id: props.componentId,
    }),
  )

  if (!root) {
    root = ReactDOM.createRoot(containerRef.value)
  }
  root.render(element)
}

onMounted(async () => {
  await loadReact()
  renderEmbed()
})

watch(
  () => [props.accessToken, props.componentId],
  () => {
    if (loaded) renderEmbed()
  },
)

onUnmounted(() => {
  if (root) {
    root.unmount()
    root = null
  }
})
</script>

<template>
  <div ref="containerRef"></div>
</template>
