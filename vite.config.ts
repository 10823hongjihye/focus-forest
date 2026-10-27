import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const buildId = new Date().toISOString();

function versionFile(): Plugin {
  return {
    name: 'focus-forest-version',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ id: buildId }),
      });
    },
  };
}

export default defineConfig({
  base: './',
  define: {
    __APP_BUILD_ID__: JSON.stringify(buildId),
  },
  plugins: [react(), versionFile()],
  server: { port: 5173 },
});
