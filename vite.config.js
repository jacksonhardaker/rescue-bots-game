import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ mode }) => {
  const isBotCheck = mode === 'botcheck';
  return {
    plugins: [viteSingleFile()],
    build: {
      outDir: 'docs',
      emptyOutDir: false,
      target: 'esnext',
      assetsInlineLimit: 100000000,
      chunkSizeWarningLimit: 100000,
      rollupOptions: {
        input: fileURLToPath(new URL(isBotCheck ? './botcheck.html' : './index.html', import.meta.url))
      }
    }
  };
});
