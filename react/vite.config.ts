import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            input: {
                sidebar: 'sidebar/index.html',
                panel: 'main/index.html'
            }
        },
        outDir: '../media/webview',
        emptyOutDir: true
    }
});