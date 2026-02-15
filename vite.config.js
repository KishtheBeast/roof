import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const apiKey = (env.VITE_ANTHROPIC_API_KEY || '').trim();

    console.log('[Vite Config] Proxy Initializing...', {
        keyDetected: !!apiKey,
        keyPrefix: apiKey.substring(0, 10) + '...'
    });

    return {
        plugins: [react()],
        base: '/roof/',
        server: {
            proxy: {
                '/api/anthropic': {
                    target: 'https://api.anthropic.com',
                    changeOrigin: true,
                    rewrite: (path) => '/v1/messages',
                    configure: (proxy, options) => {
                        proxy.on('proxyReq', (proxyReq, req, res) => {
                            // Strip browser headers that trigger Anthropic CORS detection
                            proxyReq.removeHeader('Origin');
                            proxyReq.removeHeader('Referer');

                            // Set essential headers for the UPSTREAM request
                            proxyReq.setHeader('x-api-key', apiKey);
                            proxyReq.setHeader('anthropic-version', '2023-06-01');
                            proxyReq.setHeader('content-type', 'application/json');
                            // Add this fallback just in case, though stripping Origin should suffice
                            proxyReq.setHeader('anthropic-dangerous-direct-browser-access', 'true');

                            console.log('[Proxy] Forwarding to Anthropic (Cleaned Headers)');
                        });
                        proxy.on('proxyRes', (proxyRes, req, res) => {
                            console.log('[Proxy] Response from Anthropic:', proxyRes.statusCode);
                        });
                        proxy.on('error', (err, req, res) => {
                            console.error('[Proxy] Error:', err);
                        });
                    }
                }
            }
        }
    }
})
