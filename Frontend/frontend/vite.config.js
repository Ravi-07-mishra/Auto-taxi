import { defineConfig } from 'vite';

// vite.config.js
export default defineConfig({
    // server: {
    //     proxy: {
    //         '/socket.io': {
    //             target: 'http://localhost:3000',
    //             changeOrigin: true,
    //             ws: true, // Enables WebSocket proxying
    //         },
    //         '/api': {
    //             target: 'http://localhost:3000',
    //             changeOrigin: true,
    //             // No need to rewrite the URL, so remove the rewrite option
    //         },
    //     },
    // },
});
