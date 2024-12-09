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
            <van-button size="small">完成拉线</van-button>  
            <van-button size="small">加入工单</van-button>
        </template>
      </van-card>
    </van-list>
  </van-pull-refresh>
</div>  

    <van-submit-bar :price="30500" button-text="提交工单" @submit="onSubmit" style="margin-bottom: 1.33rem;">
        <!-- <template #tip>
            你的工作清单里有未全部完成的设备接线，待全部完成后结算 <span @click="onClickLink"></span>
        </template> -->
        </van-submit-bar>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { showToast } from 'vant'
  import dianlanImage from '@/assets/xianlan.jpg';
  import http from '@/api/request';
  const show1 = ref(true);
  const showTop = ref(false);
  const sw = ref(''); // 当前选中的类型
  const search_word = ref(''); // 当前输入的搜索词
  
  const list = ref([]);
  const show_list = ref([]);
  const loading = ref(false);
  const finished = ref(false);
  const refreshing = ref(false);
  const page = ref(0);

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
  

  
  // showTop.value = false;
  </script>
  
  <style scoped>
  /* 样式根据需要自定义 */
  .card-container {
    margin-bottom: 3.5rem; /* 给内容容器添加底部外边距，避免被 submit-bar 遮挡 */
    overflow-y: auto; /* 保证内容可以滚动 */
    max-height: calc(100vh - 100px); /* 动态调整高度 */
  }
  </style>
  