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

    }
];


const router=createRouter({
    history: createWebHashHistory(),
    routes,
})

export default router;