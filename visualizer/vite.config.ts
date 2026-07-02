import { defineConfig } from 'vite';
import { eventsPlugin } from './server/events-plugin';

export default defineConfig({
  plugins: [eventsPlugin()],
  server: {
    port: 5199,
    strictPort: true,
  },
  preview: {
    port: 5199,
    strictPort: true,
  },
});
