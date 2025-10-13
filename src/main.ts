import './styles/main.css'

import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

import App from './App.vue'
import VueApexCharts from 'vue3-apexcharts'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router/index'

const app = createApp(App)
app.use(createPinia())

const queryClient = new QueryClient()
app.use(VueQueryPlugin, { queryClient })
app.use(router)
app.mount('#app')
app.use(VueApexCharts)

