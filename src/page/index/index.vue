<template>
    <van-popup v-model:show="showTop" position="top" round :style="{ height: '50%' }" @click-overlay="handlePopupClose">
      <van-search
        v-model="search_word"
        :placeholder="`搜索${ sw || ''}`"
        input-align="center"
        autofocus
        clearable
        @search="search"
        
      />
      <van-list>
        <van-cell-group>
          <van-cell
            v-for="item in list"
            :key="item.key"
            :title="item.title"
            @click="select(item.title)"
          />
        </van-cell-group>
      </van-list>
    </van-popup>
    <van-popup v-model:show="showPicker" destroy-on-close round position="bottom">
      <van-picker
        :model-value="pickerValue"
        :columns="columns"
        @cancel="showPicker = false"
        @confirm="onConfirm"
      />
      
    </van-popup>
    <van-popup v-model:show="showCartPopup" destroy-on-close round position="bottom" :style="{ height: '80%' }">
      <van-swipe-cell v-for="(item,index) in cart">
        
        <van-card
        
        :num="item.num"
        :price="item.price"
        :desc="item.model+'  '+ item.specification"
        :tag="item.proj.substr(-4)"
        :title="item.daihao"
        :thumb="dianlanImage"
        style="--van-card-font-size: 0.4rem;"
        >
        <template #tags>
            <van-tag v-if="item.facilities" plain type="primary" style="margin-right: 0.1rem;">{{ item.facilities }}</van-tag>
            <van-tag v-if="item.facilities_loca" plain type="primary" style="margin-right: 0.1rem;">{{ item.facilities_loca }}</van-tag>
            <van-tag v-if="item.facilities_name" plain type="primary">{{ item.facilities_name }}</van-tag>
        </template>
        
      </van-card>
        <template #right>
          <van-button square type="danger" text="删除" @click="delCart(index)" class="delete-button"/>
        </template>
      </van-swipe-cell>
      
    </van-popup>
    <van-grid direction="horizontal" :column-num="3" clickable 
      style="z-index: 10; position: sticky; top: 0; background-color: #fff;">
      <van-grid-item
        v-for="(item, index) in gridItems"
        :key="index"
        :text="item.text"
        :style="{
          '--van-grid-item-text-color': selected[index] ? '#000' : '#ccc',
        }"
        @click="handleGridClick(index)"
      />
    </van-grid>
<div class="card-container">
  <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
    <van-list
      v-model:loading="loading"
      :finished="finished"
      finished-text="没有更多了"
      @load="onLoad"
    >
    <van-card
        v-for="item in show_list"
        :num="item.num"
        :price="item.price"
        :desc="item.model+'  '+ item.specification"
        :tag="item.proj.substr(-4)"
        :title="item.daihao"
        :thumb="dianlanImage"
        style="--van-card-font-size: 0.4rem;"
        >
        <template #tags>
            <van-tag v-if="item.facilities" plain type="primary" style="margin-right: 0.1rem;">{{ item.facilities }}</van-tag>
            <van-tag v-if="item.facilities_loca" plain type="primary" style="margin-right: 0.1rem;">{{ item.facilities_loca }}</van-tag>
            <van-tag v-if="item.facilities_name" plain type="primary">{{ item.facilities_name }}</van-tag>
        </template>
        <template #footer>
            <!-- <van-button v-if="userStore.userInfo.userRole < 4" :disabled="(item.last_fangxian && item.last_fangxian!=userStore.userInfo.userCode)" size="small" @click="laxian(item)">{{ item.fangxianren || '完成拉线' }}

            </van-button> -->
            <van-button
              v-if="userStore.userInfo.userRole < 4"
              :disabled="item.last_fangxian && item.last_fangxian !== userStore.userInfo.userCode"
              :type="(item.last_fangxian && item.last_fangxian !== userStore.userInfo.userCode) ? 'warning' : 'default'"
              size="small"
              @click="laxian(item)"
            >{{ item.fangxianren || '完成拉线' }}</van-button>
            <van-button size="small" @click="addCart(item)">加入工单</van-button>
        </template>
      </van-card>
    </van-list>
  </van-pull-refresh>
</div>  



    <van-submit-bar :price="totalPrice" button-text="提交工单" @submit="onSubmit" style="margin-bottom: 1.33rem;">
        <template #default>
          <div style="display: flex; justify-content: flex-end; align-items: center;">
            <van-action-bar-icon
              icon="add-o"
              text="全选"
              @click="addAll2Cart()"
            />
            <van-action-bar-icon
              icon="cart-o"
              :badge="cart.length"
              text="已选"
              :class="{ 'scale-animation': isScaling }"
              @click="showCartPopup=true"
            />
          </div>
        </template>
        <!-- <template #tip>
            你的工作清单里有未全部完成的设备接线，待全部完成后结算 <span @click="onClickLink"></span>
        </template>  -->
    </van-submit-bar>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import { showToast } from 'vant'
  import dianlanImage from '@/assets/xianlan.jpg';
  import http from '@/api/request';
  import { showConfirmDialog  } from 'vant';
  import { useUserStore } from '@/store/userStore';
  const userStore = useUserStore();
  const cart = ref([]);
  const showTop = ref(false);
  const sw = ref(''); // 当前选中的类型
  const search_word = ref(''); // 当前输入的搜索词
  const isScaling = ref(false);
  const list = ref([]);
  const show_list = ref([]);
  const loading = ref(false);
  const finished = ref(false);
  const refreshing = ref(false);
  const page = ref(0);
  const totalPrice = ref(0.00)
  const clickItem = ref(null)

  const columns = ref([
      { text: '', value: '' },
  ])

  const fieldValue = ref('');
  const showPicker = ref(false);
  const showCartPopup = ref(false);
  const pickerValue = ref([]);

  let lastRequestTime = 0;
  const throttleDelay = 1000; 
  // Grid 项数据
  const gridItems = ref([
    { text: '公司', key: '公司' },
    { text: '船号', key: '船号' },
    { text: '代号', key: '代号' },
    { text: '型号', key: '型号' },
    { text: '规格', key: '规格' },
    { text: '设备', key: '设备' },
  ]);

  const onConfirm = async({ selectedValues, selectedOptions }) => {
    console.log('selectedValues:', selectedValues[0]);
    const res = await http.post('/public/api/laxian', {
      ope: userStore.userInfo.userCode,
      proj: 'N'+clickItem.value.proj.slice(-4),
      xian_id: clickItem.value.id
    });
    if (res.data.affectedRows > 0) {
      showToast('拉线成功')
      const targetItem = show_list.value.find(item => item.id === clickItem.value.id);
      if (targetItem) {
        targetItem.fangxianren = userStore.userInfo.userName; // 更新放线人
        targetItem.last_fangxian = userStore.userInfo.userCode; // 更新最后放线人
      }

      console.log('更新后的 show_list:', show_list.value);
      
    }
    showPicker.value = false;
    pickerValue.value = selectedValues;
    fieldValue.value = selectedOptions[0].text;
  };

  const delCart = (index) => {
    cart.value.splice(index, 1);
    totalPrice.value = cart.value.reduce((total, item) => total + item.baseprice*100, 0);
    console.log('车内容：', cart.value);
  };

  const addAll2Cart = () => {
    console.log('尝试添加所有到车：', show_list.value);

    // 筛选出未在购物车中的商品
    const newItems = show_list.value.filter(item => 
      !cart.value.some(cartItem => cartItem.id === item.id)
    );

    if (newItems.length === 0) {
      // 如果所有商品都已存在，显示提示
      showToast('所有都已经加入');
    } else {
      // 将未在购物车中的商品加入购物车
      cart.value.push(...newItems);
      totalPrice.value += newItems.reduce((total, item) => total + item.baseprice*100, 0);
      console.log('车内容：', cart.value);

      // 触发放大缩小动画
      isScaling.value = true;

      // 在动画完成后移除类名
      setTimeout(() => {
        isScaling.value = false;
      }, 300); // 与 CSS 动画时间一致
    }
  };

  const addCart = (item) => {
    console.log('尝试添加到车：', item);

    // 检查 item.id 是否已经存在于 cart 中
    const isInCart = cart.value.some(cartItem => cartItem.id === item.id);

    if (isInCart) {
      // 显示提示消息
      showToast('已经加入');
    } else {
      // 添加到购物车
      cart.value.push(item);
      console.log('车内容：', cart.value);
      totalPrice.value += item.baseprice*100;
      // 触发放大缩小动画
      isScaling.value = true;

      // 在动画完成后移除类名
      setTimeout(() => {
        isScaling.value = false;
      }, 300); // 与 CSS 动画时间一致
    }
  };

  const laxian = async(item) => {
    console.log('拉线： ',item);
    if (item.last_fangxian && item.last_fangxian==userStore.userInfo.userCode){
      showConfirmDialog({
        title: '取消拉线？',
        message:
          '',
      })
        .then(async() => {
          // on confirm
          const res = await http.post('/public/api/laxian', {
            ope: null,
            proj: 'N'+item.proj.slice(-4),
            xian_id: item.id
          })
          if (res.data.affectedRows > 0) {
            showToast('取消拉线成功！')
            const targetItem = show_list.value.find(item1 => item1.id === item.id);
            if (targetItem) {
              targetItem.fangxianren = null; // 更新放线人
              targetItem.last_fangxian = null; // 更新最后放线人
            }
            console.log(show_list.value);
          }
        })
        .catch(() => {
          // on cancel
        });
    }else{
      console.log('完成拉线',item,searchWords.value['船号']);
      clickItem.value = item;
      const res = await http.post('/public/api/search_loca', {
        ope: userStore.userInfo.userCode,
        proj: 'N'+item.proj.slice(-4) 
      });
      console.log('拉线： ', res.data);
      columns.value = res.data.map(item => ({
        text: item.itemname,  // 将 itemname 作为 text
        value: item.itemname   // 将 itemname 作为 value
      }));
      showPicker.value = true;
    }
   
  };
  
  // 选中的状态
  const selected = ref(Array(gridItems.value.length).fill(false));
  const searchWords = ref({
    '公司': '',
    '船号': '',
    '代号': '',
    '型号': '',
    '规格': '',
    '设备': '',
  }); // 存储每个 grid 的搜索词
  
  const onSubmit = () => {
    console.log('提交工单');
  };

  const onLoad = async () => {
        
        page.value++; // 增加页码
        
        if (refreshing.value) {
          page.value = 0
          show_list.value = [];
          refreshing.value = false;
        }
        
        const responseData = await fetchData();
        if (!responseData) {
          loading.value = false; // 确保加载状态被重置
          return;
        }
        console.log('返回电缆值：', responseData.totalCount,responseData.data);
        for (let i = 0; i < responseData.data.length; i++) {
          show_list.value.push(responseData.data[i]);
        }
        loading.value = false;

        if (show_list.value.length >= responseData.totalCount) {
          finished.value = true;
        }
      
    };

  const onRefresh = () => {
      // 清空列表数据
      finished.value = false;
      page.value = 0; // 重置页码
      // 清空列表数据
      show_list.value = [];
      // 重新加载数据
      // 将 loading 设置为 true，表示处于加载状态
      loading.value = true;
      onLoad();
  };

  const fetchData = async () => {
    const now = Date.now();
    if (now - lastRequestTime < throttleDelay) {
      // loading.value = false;
      showToast('请求过于频繁，请稍后再试。');
      return null; // 如果在节流时间内，不执行函数
    }
    lastRequestTime = now;
    // 在 fetchData 中构造 sd 数据
    const url = '/public/api/search_dl';
    const data = {
      company: searchWords.value['公司'],
      proj: searchWords.value['船号'],
      daihao: searchWords.value['代号'],
      model: searchWords.value['型号'],
      spec: searchWords.value['规格'],
      facilities: searchWords.value['设备'],
      page: page.value*10,
    };

    try {
      const response = await http.post(url, data);
      return { data:response.data,totalCount:response.totalCount};
    } catch (error) {
      console.error('请求失败:', error);
      throw error;
    }
  };

  // 选择搜索结果
  const select = async (title) => {
    console.log('Selected:', title);
    const index = gridItems.value.findIndex((item) => item.key === sw.value);
    console.log('index: ',index);   
    if (index !== -1) {
      gridItems.value[index].text = title; // 更新 grid 文本
      selected.value[index] = true; // 标记为选中
    }
    try {
      
      list.value = [];
      searchWords.value[sw.value] = title; // 保存搜索词
      page.value = 0;
      const responseData = await fetchData();
      console.log('返回电缆值：', responseData.totalCount,responseData.data);
      show_list.value = responseData.data;
      showTop.value = false; // 关闭弹窗
    } catch (error) {
      console.error('处理请求时出错:', error);
    }
  };

// 监听搜索框关闭时，保存当前搜索词
const handlePopupClose = () => {
    //console.log('Popup closed');
    // showToast('搜索框关闭了'+search_word.value)
    list.value = [];
    if (search_word.value.length == 0) {
      const currentKey = gridItems.value.find((item) => item.key === sw.value)?.key;
      console.log('搜索框关闭时候index: ',currentKey);
      if (currentKey) {
        searchWords.value[currentKey] = search_word.value;
        const index = gridItems.value.findIndex((item) => item.key === currentKey);
        if (index !== -1) {
            refreshing.value = true;
            onLoad();
            gridItems.value[index].text = currentKey; // 恢复默认的 key 作为 text
            selected.value[index] = false; // 取消选中状态
        }
      }
    }
    // const currentKey = gridItems.value.find((item) => item.text === sw.value)?.key;
    // if (currentKey) {
    //   searchWords.value[currentKey] = search_word.value;
    // }
};
  
  // 搜索函数
    // '公司': '',
    // '船号': '',
    // '代号': '',
    // '型号': '',
    // '规格': '',
    // '设备': '',
  const search = async () => {
    console.log('search',search_word.value,sw.value);
    search_word.value = search_word.value.trim().toUpperCase(); // 去除首尾空格
    const sd = {
      'sw': sw.value,
      'company': sw.value=='公司'?search_word.value:searchWords.value['公司'],
      'proj': sw.value=='船号'?search_word.value:searchWords.value['船号'],
      'daihao': sw.value=='代号'?search_word.value:searchWords.value['代号'],
      'model': sw.value=='型号'?search_word.value:searchWords.value['型号'],
      'spec': sw.value=='规格'?search_word.value:searchWords.value['规格'],
      'facilities_name': sw.value=='设备'?search_word.value:searchWords.value['设备'],
    };
    var url = '/public/api/search_company';
   
    const response = await http.post(url, sd);
    console.log('返回值：',response.data)
    const tmp = [];
    for (let i = 0; i < response.data.length; i++) {
      if (sw.value=='公司'){
        tmp.push({ key: i, title: response.data[i]['company'] });
        // 需要去重

      }else if (sw.value=='船号'){
        tmp.push({ key: i, title: response.data[i]['proj'] });
      }
      else if (sw.value=='代号'){
        tmp.push({ key: i, title: response.data[i]['daihao'] });
      }else if (sw.value=='型号'){
        tmp.push({ key: i, title: response.data[i]['model'] });
      }else if (sw.value=='规格'){
        tmp.push({ key: i, title: response.data[i]['specification'] });
      }else if (sw.value=='设备'){
        tmp.push({ key: i, title: response.data[i]['facilities_name'] });
      }
    }
    list.value = tmp;
    //console.log(list.value);
  };
  
  // 点击 Grid 事件
  const handleGridClick = (index) => {
    
    const selectedItem = gridItems.value[index];

    sw.value = selectedItem.key; // 设置当前类型
    console.log('点击grid： ',sw.value);
    if (!['公司','船号'].includes(sw.value) && (searchWords.value['公司'] == '' || searchWords.value['船号'] == '')) {
      showToast('请先选择公司和船号');
      return;
    }
    // 如果已经选中过，恢复之前的搜索词；否则清空搜索词
    search_word.value = searchWords.value[selectedItem.key] || '';
    console.log('search_word.value: ',searchWords.value);
    showTop.value = true; // 显示搜索弹窗
  };

  onMounted( () => {
    
    console.log("首页加载啦; ",userStore.userInfo);
 
  })
  

  
  // showTop.value = false;
  </script>
  
  <style scoped>
  /* 样式根据需要自定义 */
  .card-container {
    margin-bottom: 3.5rem; /* 给内容容器添加底部外边距，避免被 submit-bar 遮挡 */
    overflow-y: auto; /* 保证内容可以滚动 */
    max-height: calc(100vh - 100px); /* 动态调整高度 */
  }

  .scale-animation {
    animation: scale-animation 0.3s ease-in-out;
  }

  @keyframes scale-animation {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.3);
    }
    100% {
      transform: scale(1);
    }
  }

  .delete-button {
    height: 100%;
  }
  </style>
  