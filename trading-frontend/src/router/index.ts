import { createRouter, createWebHistory } from 'vue-router'
import TradeManager from '@/views/TradeManager.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: TradeManager,
    },
  ],
})

export default router
