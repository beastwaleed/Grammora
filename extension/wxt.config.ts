import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Grammora — AI Writing Assistant',
    description: 'Open-source AI writing copilot for grammar correction, sentence completion, and tone adjustment.',
    version: '0.1.0',
    permissions: [
      'storage',
      'activeTab',
    ],
    host_permissions: [
      'http://localhost:3001/*',
    ],
    action: {
      default_title: 'Grammora',
    },
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      128: 'icon/128.png',
    },
  },
});

