import { createApp } from 'vue'
// import './style.css'
import App from './App.vue'
import { createPinia } from 'pinia'
import router from './router/index.js'
import 'amfe-flexible'
import { Button,Field, Cell, Popover,Uploader , DropdownMenu,Notify , DropdownItem , Calendar,CellGroup,Form, Tabbar,Col,Row, TabbarItem, Tag, Checkbox,CheckboxGroup,Grid, GridItem, Popup, Search, List, Toast, SubmitBar, Card, PullRefresh,Dialog, SwipeCell, ActionBar, ActionBarIcon, ActionBarButton,FloatingBubble   ,Picker  } from 'vant'
import { Image as VanImage } from 'vant';
import 'vant/lib/index.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)

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
