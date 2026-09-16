import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            input: {
                main: 'main/index.html',
                sidebar: 'sidebar/index.html'
            }
        },
        outDir: '../media/webview',
        emptyOutDir: true,
        assetsInlineLimit: Infinity
    }
});