import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../src/views/HomeView.vue";
import SearchView from "../src/views/SearchView.vue";


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
        component: SearchView
    },
]


export const router = createRouter({
    // @ts-ignore
    history: createWebHistory(import.meta.env.BASE_URL),
    routes

})
