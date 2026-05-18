import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const srcDir = fileURLToPath(new URL('./src', import.meta.url))


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(srcDir, 'assets', filename)
      }
    },
  }
}

export default defineConfig(({ command }) => ({
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': srcDir,
    },
  },

  build: command === 'build'
    ? {
        lib: {
          entry: path.resolve(srcDir, 'index.ts'),
          name: 'WebScreenDesignPrototype',
          formats: ['es', 'cjs'],
          fileName: format => (format === 'es' ? 'index.js' : 'index.cjs'),
          cssFileName: 'style',
        },
        rollupOptions: {
          external: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
        },
      }
    : undefined,

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  server: {
    port: 3000,
    // Décommentez la ligne suivante pour exposer au réseau:
    // host: '0.0.0.0',
  },
}))
