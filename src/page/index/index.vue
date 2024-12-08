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
    <van-card
        v-for="item in show_list"
        :num="item.num"
        :price="item.price"
        :desc="item.specification"
        :tag="item.proj.substr(-4)"
        :title="item.daihao"
        :thumb="dianlanImage"
        style="--van-card-font-size: 0.4rem;"
        >
        <template #tags>
            <van-tag v-if="item.model" plain type="primary" style="margin-right: 0.1rem;">{{ item.model }}</van-tag>
            <van-tag v-if="item.facilities" plain type="primary">{{ item.facilities }}</van-tag>
        </template>
        <template #footer>
            <van-button size="small">加入工单</van-button>
        </template>
    </van-card>
    </div>  

    <van-submit-bar :price="30500" button-text="提交工单" @submit="onSubmit" style="margin-bottom: 1.33rem;">
        <template #tip>
            你的工作清单里有未全部完成的设备接线，待全部完成后结算 <span @click="onClickLink"></span>
        </template>
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
  const show_list = ref([
    { title: 'SED2-3', desc: '标题1' ,num:1, price:3.15,tag:'N1398'},
    { title: 'SED2-4', desc: '标题2' ,num:3, price:3.15,tag:'N1453'},
    { title: 'SED2-5', desc: '标题3' ,num:3, price:3.15,tag:'N1452'},
    { title: 'SED2-6', desc: '标题4' ,num:3, price:3.15,tag:'N1452'},
    { title: 'SED2-7', desc: '标题5' ,num:3, price:3.15,tag:'N1452'},
    { title: 'SED2-8', desc: '标题6' ,num:3, price:3.15,tag:'N1452'},
    { title: 'SED2-9', desc: '标题6' ,num:3, price:3.15,tag:'N1452'},
    { title: 'SED2-0', desc: '标题6' ,num:3, price:3.15,tag:'N1452'},
    { title: 'SED2-11',desc:'标题6'  ,num:3, price:3.15,tag:'N1452'},
    { title: 'RCS232', desc: '标题6' ,num:3, price:3.15,tag:'N1452'},
    { title: 'RCS233', desc: '标题6' ,num:3, price:3.15,tag:'N1452'},
    { title: 'RCS234', desc: '标题6' ,num:3, price:3.15,tag:'N1452'},
    { title: 'RCS235', desc: '标题6' ,num:3, price:3.15,tag:'N1452'},
    { title: 'RCS236', desc: '标题6' ,num:3, price:3.15,tag:'N1452'},
    { title: 'RCS237', desc: '标题6' ,num:3, price:3.15,tag:'N1452'},
    { title: 'RCS238', desc: '标题6' ,num:3, price:3.15,tag:'N1452'},
    { title: 'RCS239', desc: '标题6' ,num:3, price:3.15,tag:'N1452'},
    { title: 'RCS230', desc: '标题6' ,num:3, price:3.15,tag:'N1452'},
    { title: 'RCS232', desc: '标题6' ,num:3, price:3.15,tag:'N1452'},
    { title: 'RCS232', desc: '标题6' ,num:3, price:3.15,tag:'N1452'},
    { title: 'RCS232', desc: '标题6' ,num:3, price:3.15,tag:'N1452'},
    { title: 'RCS232', desc: '标题6' ,num:3, price:3.15,tag:'N1452'},
    { title: 'RCS232', desc: '标题6' ,num:3, price:3.15,tag:'N1452'},
    { title: 'RCS232', desc: '标题6' ,num:3, price:3.15,tag:'N1452'},
    { title: 'RCS244', desc: '标题7' ,num:7, price:3.15,tag:'N2452'},
  ]);
  
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
  // 选择搜索结果
  const select = async (title) => {
    console.log('Selected:', title);
    const index = gridItems.value.findIndex((item) => item.key === sw.value);
    console.log('index: ',index);   
    if (index !== -1) {
      gridItems.value[index].text = title; // 更新 grid 文本
      selected.value[index] = true; // 标记为选中
    }
    var url = '/public/api/search_dl';
    const sd = {
      'company': searchWords.value['公司'],
      'proj': searchWords.value['船号'],
      'daihao': searchWords.value['代号'],
      'model': searchWords.value['型号'],
      'spec': searchWords.value['规格'],
      'facilities': searchWords.value['设备'],
    };
    const response = await http.post(url, sd);
    console.log('返回电缆值：',response.data)
    show_list.value = response.data;
    searchWords.value[sw.value] = title; // 保存搜索词
    showTop.value = false; // 关闭弹窗
  };

// 监听搜索框关闭时，保存当前搜索词
const handlePopupClose = () => {
    //console.log('Popup closed');
    // showToast('搜索框关闭了'+search_word.value)
    if (search_word.value.length == 0) {
      const currentKey = gridItems.value.find((item) => item.key === sw.value)?.key;
      console.log('搜索框关闭时候index: ',currentKey);
      if (currentKey) {
        searchWords.value[currentKey] = search_word.value;
        const index = gridItems.value.findIndex((item) => item.key === currentKey);
        if (index !== -1) {
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
      'facilities': sw.value=='设备'?search_word.value:searchWords.value['设备'],
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
        tmp.push({ key: i, title: response.data[i]['facilities'] });
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
  