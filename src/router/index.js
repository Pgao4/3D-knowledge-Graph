import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/2dView.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/3dView',
    name: '3dView',
    component: () => import('../views/3dView.vue')
  }
]

const router = new VueRouter({
  routes
})

export default router
