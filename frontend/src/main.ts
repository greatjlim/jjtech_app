import { createApp } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'

createApp(App).use(router).use(vuetify).use(VueApexCharts).component('apexchart', VueApexCharts).mount('#app')
