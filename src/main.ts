import './styles/main.css'

import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

import App from './App.vue'
import VueApexCharts from 'vue3-apexcharts'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router/index'

const app = createApp(App)

app.use(createPinia())

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, 
    },
  },
})
app.use(VueQueryPlugin, { queryClient })

app.use(router)
app.use(VueApexCharts)
app.mount('#app')