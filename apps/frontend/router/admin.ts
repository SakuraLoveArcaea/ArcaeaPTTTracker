import { createRouter, createWebHistory } from "vue-router";

const routes = [
    {
        path: '/',
        component: () => import('../src/views/AdminView.vue')
    }
]

export const router = createRouter({
    history: createWebHistory(),
    routes

})