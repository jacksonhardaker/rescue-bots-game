import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ mode }) => {
  const inputFile = mode === 'botcheck'
    ? './botcheck.html'
    : (mode === 'modelcheck' ? './modelcheck.html' : './index.html');
  return {
    plugins: [viteSingleFile()],
    build: {
      outDir: 'docs',
      emptyOutDir: false,
      target: 'esnext',
      assetsInlineLimit: 100000000,
      chunkSizeWarningLimit: 100000,
      rollupOptions: {
        input: fileURLToPath(new URL(inputFile, import.meta.url))
      }
    }
  };
});
