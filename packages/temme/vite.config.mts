import { defineConfig } from 'vitest/config'
import { externalizeDeps as external } from 'vite-plugin-externalize-deps'
import { checker } from 'vite-plugin-checker'
import dts from 'vite-plugin-dts'

import pkg from './package.json' assert { type: 'json'}

export default defineConfig({
  plugins: [
    checker({ typescript: true }),
    external(),
    dts({
      outDir: 'types'
    })
  ],
  define: {
    'process.env': {
      PKG_VERSION: pkg.version
    }
  },
  build: {
    copyPublicDir: false,
    lib: {
      entry: 'src/index.ts',
      name: 'Temme',
      formats: ['es', 'cjs'],
      fileName: 'index'
    },
  },
  test: {
    include: ['__tests__/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'json-summary', 'json'],
      reportOnFailure: true
    },
  },
})
