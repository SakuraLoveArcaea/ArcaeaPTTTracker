import { createRouter, createWebHistory } from "vue-router";

const routes = [
    {
        path: '/',
        name: 'admin',
        component: () => import('../src/views/AdminView.vue')
    }
]

export const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
})