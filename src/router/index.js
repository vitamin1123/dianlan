import { createRouter, createWebHashHistory, createWebHistory } from "vue-router";


const routes = [
    {
        path:"/",
        name: 'mine',
        component: () => import("@/page/mine/mine.vue"),
    },
    {
        path:"/mine_dt",
        name: 'mine_dt',
        component: () => import("@/page/mine_dt/mine_dt.vue"),
    },
    {
        path:"/index",
        name: 'index',
        component: () => import("@/page/index/index.vue"),

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
        path:"/work1",
        name: 'work1',
        component: () => import("@/page/work1/work1.vue"),

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

    },
    {
        path:"/myana-fangxian",
        name: 'myana-fangxian',
        component: () => import("@/page/myana-fangxian/myana-fangxian.vue"),

    },
    {
        path:"/myana-laxian",
        name: 'myana-laxian',
        component: () => import("@/page/myana-laxian/myana-laxian.vue"),

    },
    {
        path:"/myana-peo",
        name: 'myana-peo',
        component: () => import("@/page/myana-peo/myana-peo.vue"),

    },
    {
        path:"/myana-proj",
        name: 'myana-proj',
        component: () => import("@/page/myana-proj/myana-proj.vue"),

    },
    {
        path:"/se-proj",
        name: 'se-proj',
        component: () => import("@/page/se-proj/se-proj.vue"),

    },
    {
        path:"/seriesbook",
        name: 'seriesbook',
        component: () => import("@/page/seriesbook/seriesbook.vue"),

    },
    {
        path:"/dianlan_baseprice",
        name: 'dianlan_baseprice',
        component: () => import("@/page/dianlan_baseprice/dianlan_baseprice.vue"),

    }
    ,
    {
        path:"/ep_baseprice",
        name: 'ep_baseprice',
        component: () => import("@/page/ep_baseprice/ep_baseprice.vue"),

    },
    {
        path:"/login",
        name: 'login',
        component: () => import("@/page/login/login.vue"),

    },
    {
        path:"/paied",
        name: 'paied',
        component: () => import("@/page/paied/paied.vue"),

    }
];


const router=createRouter({
    history: createWebHistory(),
    // history: createWebHashHistory(),
    routes,
})

export default router;