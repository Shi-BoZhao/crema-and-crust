import { defineConfig } from 'vite';
import { eventsPlugin } from './server/events-plugin';

export default defineConfig({
  plugins: [eventsPlugin()],
  server: {
    // Mac では localhost が IPv6(::1) のみになり、127.0.0.1 / ngrok が届かないことがある
    host: '127.0.0.1',
    port: 5199,
    strictPort: true,
    // ngrok / cloudflared 経由の Host ヘッダを許可(Vite 6 の DNS rebinding 対策)
    allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app', '.trycloudflare.com'],
  },
  preview: {
    host: '127.0.0.1',
    port: 5199,
    strictPort: true,
    allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app', '.trycloudflare.com'],
  },
});
