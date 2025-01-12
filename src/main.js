import { createApp } from 'vue'
// import './style.css'
import App from './App.vue'
import { createPinia } from 'pinia'
import router from './router/index.js'
import 'amfe-flexible'
import { Button,Field, Cell, Popover,Uploader , DropdownMenu,Notify , DropdownItem , Calendar,CellGroup,Form, Tabbar,Col,Row, TabbarItem, Tag, Checkbox,CheckboxGroup,Grid, GridItem, Popup, Search, List, Toast, SubmitBar, Card, PullRefresh,Dialog, SwipeCell, ActionBar, ActionBarIcon, ActionBarButton,FloatingBubble   ,Picker  } from 'vant'
import { Image as VanImage } from 'vant';
import 'vant/lib/index.css'
import { useUserStore } from '@/store/userStore';
import http from '@/api/request';
const app = createApp(App)
app.use(createPinia())
app.use(router)


router.beforeEach(async (to, from, next) => {
    const userStore = useUserStore();

    // 仅在默认路由 "/" 时处理 token
    if (to.path === '/') {
        const url = new URL(window.location.href);
        const token = url.searchParams.get('token');
  
        if (token) {
            // 存储 token 到 userStore
            userStore.setToken(token);

            // 移除 token 参数
            url.searchParams.delete('token');
            window.history.replaceState({}, '', url.pathname + url.hash);

            try {
                // 请求用户信息
                const userInfo = await http.get('/public/api/user-info', {
                    headers: { Authorization: `Bearer ${token}` }
                });
  
                // 存储用户信息到 userStore
                userStore.setUserInfo(userInfo);
            } catch (error) {
                console.error('获取用户信息失败', error);
            }
        }
    }

    next(); // 继续导航
});


app.use(VanImage);
app.use(Popover);
app.use(Uploader)
app.use(Notify);
app.use(Calendar);
app.use(Button)
app.use(Form)
app.use(DropdownMenu)
app.use(DropdownItem)
app.use(Field)
app.use(Tabbar)
app.use(GridItem)
app.use(Checkbox)
app.use(CheckboxGroup)
app.use(Tag)
app.use(Col)
app.use(Row)
app.use(Popup)
app.use(Grid)
app.use(List)
app.use(Search)
app.use(SubmitBar)
app.use(Card)
app.use(TabbarItem)
app.use(ActionBar)
app.use(ActionBarIcon)
app.use(SwipeCell)
app.use(ActionBarButton)
app.use(Cell)
app.use(FloatingBubble)
app.use(Dialog)
app.use(Toast)
app.use(Picker)
app.use(PullRefresh)
app.use(CellGroup)
app.mount('#app')
