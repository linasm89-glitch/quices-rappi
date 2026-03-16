jsimport { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  preview: {
    allowedHosts: ['training-hour-frontend-production.up.railway.app'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'motion': ['framer-motion'],
          'socket': ['socket.io-client'],
        }
      }
    },
    chunkSizeWarningLimit: 600,
  }
})
```

Luego en terminal:
```
git add frontend/vite.config.js
git commit -m "allow railway host in vite preview"
git push