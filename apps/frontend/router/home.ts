import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../src/views/HomeView.vue";
import Search from "../src/views/Search.vue";

const routes = [
    {
        path: '/',
        redirect: '/home'
    },
    {
        path: '/home',
        name: 'home',
        component: HomeView
    },
    {
        path: '/search',
        component: Search
    },
]


export const router = createRouter({
    // @ts-ignore
    history: createWebHistory(import.meta.env.BASE_URL),
    routes

})