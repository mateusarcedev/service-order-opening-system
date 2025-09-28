import { queryClient } from '@/app/providers/query';
import { router } from '@/app/router';
import { VueQueryPlugin } from '@tanstack/vue-query';
import { createPinia } from 'pinia';
import { createApp, h } from 'vue';
import App from './App.vue';

import './styles/style.css';

const app = createApp({ render: () => h(App) });
app.use(createPinia());
app.use(router);
app.use(VueQueryPlugin, { queryClient });
app.mount('#app');
