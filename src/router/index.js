import { createRouter, createWebHashHistory } from "vue-router";


const routes = [
    {
        path:"/",
        name: 'index',
        component: () => import("@/page/index/index.vue"),
    },
    {
        path:"/mine",
        name: 'mine',
        component: () => import("@/page/mine/mine.vue"),

    },
    {
        path:"/mywp",
        name: 'mywp',
        component: () => import("@/page/mywp/mywp.vue"),

    }
    ,
    {
        path:"/mytodo",
        name: 'mytodo',
        component: () => import("@/page/mytodo/mytodo.vue")
       

    },
    {
        path:"/myana",
        name: 'myana',
        component: () => import("@/page/myana/myana.vue"),

    },
    {
        path:"/usermana",
        name: 'usermana',
        component: () => import("@/page/usermana/usermana.vue"),

    },
    {
        path:"/work",
        name: 'work',
        component: () => import("@/page/work/work.vue"),

    },
    {
        path:"/locamana",
        name: 'locamana',
        component: () => import("@/page/locamana/locamana.vue"),

    },
    {
        path:"/locauser",
        name: 'locauser',
        component: () => import("@/page/locauser/locauser.vue"),

    }
];


const router=createRouter({
    history: createWebHashHistory(),
    routes,
})

export default router;