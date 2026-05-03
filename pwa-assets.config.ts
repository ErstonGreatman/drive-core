import { defineConfig } from '@vite-pwa/assets-generator/config';

export default defineConfig({
  headLinkOptions: {
    preset: 'resvg',
  },
  preset: {
    transparent: {
      sizes: [64, 192, 512],
      favicons: [[48, 'favicon.ico']],
    },
    maskable: {
      sizes: [512],
    },
    apple: {
      sizes: [180],
    },
  },
  images: ['public/pwa-source.svg'],
});
