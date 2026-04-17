import { createApp } from 'vue'
import { SchematicPlugin } from '@schematichq/schematic-vue'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)
app.use(router)
app.use(SchematicPlugin, {
  publishableKey: import.meta.env.VITE_SCHEMATIC_PUBLISHABLE_KEY || '',
})
app.mount('#app')
