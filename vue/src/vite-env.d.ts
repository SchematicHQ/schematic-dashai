/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SCHEMATIC_PUBLISHABLE_KEY: string
  readonly VITE_SCHEMATIC_COMPONENT_ID: string
  readonly VITE_SCHEMATIC_PRICING_TABLE_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
