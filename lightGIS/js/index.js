import '../css/bootstrap.css'
import Vue from 'vue'
import App from '../components/app.vue'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
Vue.use(ElementUI)
window.vm = new Vue({
    el: '#app',
    render: h => h(App)
})