import { createApp } from 'vue'
// import './style.css'
import App from './App.vue'
import router from './router/index.js'
import 'amfe-flexible'
import { Button,Field, Cell, CellGroup, Tabbar, TabbarItem, Tag, Grid, GridItem, Popup, Search, List, Toast, SubmitBar, Card, PullRefresh } from 'vant'
import { Image as VanImage } from 'vant';
import 'vant/lib/index.css'

const app = createApp(App)
app.use(router)

app.use(VanImage);
app.use(Button)
app.use(Field)
app.use(Tabbar)
app.use(GridItem)
app.use(Tag)
app.use(Popup)
app.use(Grid)
app.use(List)
app.use(Search)
app.use(SubmitBar)
app.use(Card)
app.use(TabbarItem)
app.use(Cell)
app.use(Toast)
app.use(PullRefresh)
app.use(CellGroup)
app.mount('#app')
