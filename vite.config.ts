import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load env variables from .env, .env.local, .env.[mode], .env.[mode].local
    // In GitHub Actions, the env var is passed directly, so we need to check process.env too
    const env = loadEnv(mode, process.cwd(), '');

    // Set base path for GitHub Pages
    const base = process.env.NODE_ENV === 'production' ? '/gemini-real-time-voice-chat/' : '/';

    // Get API key from environment (for GitHub Actions) or from env files (for local dev)
    // Priority: process.env (GitHub Actions) > env from files (local dev)
    // Also check API_KEY for backwards compatibility
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || env.GEMINI_API_KEY || env.API_KEY || '';

    // Get Google Custom Search API key and CX (Search Engine ID)
    const customSearchApiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY || env.GOOGLE_CUSTOM_SEARCH_API_KEY || '';
    const customSearchCx = process.env.GOOGLE_CUSTOM_SEARCH_CX || env.GOOGLE_CUSTOM_SEARCH_CX || '';

    // Log warning if API key is missing in production
    if (process.env.NODE_ENV === 'production' && !apiKey) {
      console.warn('⚠️ WARNING: GEMINI_API_KEY is not set in production build!');
    }

    return {
      base,
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(apiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(apiKey),
        'process.env.GOOGLE_CUSTOM_SEARCH_API_KEY': JSON.stringify(customSearchApiKey),
        'process.env.GOOGLE_CUSTOM_SEARCH_CX': JSON.stringify(customSearchCx),
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || mode)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
