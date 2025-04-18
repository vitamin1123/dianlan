<template>
  <van-overlay :show="isProcessing" z-index="1000">
    <div class="loading-wrapper">
      <van-loading size="24px" type="spinner" color="#1989fa">解析中...</van-loading>
    </div>
  </van-overlay>
  <van-nav-bar
    title="电器价格维护"
    left-text="返回"
    left-arrow
    @click-left="onClickLeft"
    :class="{ 'nav-bar-disabled': isProcessing }"
  />
  
  <van-popup v-model:show="showTop1" position="top" :style="{ height: '50%' }" > 
        <van-search v-model="search_word" placeholder="请输入" show-action  @search="search"/>
        <van-list>
            <van-cell v-for="item in ser_list" :key="item.id" :title="item.name" @click="select(item)"/>
        </van-list>
    </van-popup>
    <!-- 磁吸导航 -->
    <van-uploader v-show="false" ref="uploader" accept=".xls, .xlsx" :after-read="onFileRead">
      <van-button icon="plus" type="primary">上传文件</van-button>
    </van-uploader>

    <van-dialog 
  v-model:show="showUploadConfirm" 
  title="确认上传数据"
  :show-confirm-button="false"  
  :show-cancel-button="false" 
>
  <div style="max-height: 60vh; overflow-y: auto;">
    <!-- 数据列表 -->
  </div>
  
  <template #footer>
    <div style="display: flex; justify-content: space-between; padding: 10px;">
      <van-button 
        size="small" 
        @click="showUploadConfirm = false"
        style="flex: 1; margin-right: 8px;"
      >
        取消
      </van-button>
      <van-button 
        type="primary" 
        size="small" 
        @click="confirmUpload"
        style="flex: 1; margin-left: 8px;"
      >
        上传
      </van-button>
    </div>
    <div style="padding: 10px; text-align: center;">
      共 {{ parsedData.length }} 条数据
    </div>
  </template>
</van-dialog>
    
    <div class="container">
      <van-button type="primary" plain @click="handleClick" :loading="isuploading">
        {{ button_text }}
    </van-button>
      <!-- 左侧部分，占70% -->
      <van-search 
        v-model="sw" 
        placeholder="请输入搜索关键词" 
       
        @search="search_sw" 
      />
      
      <!-- 右侧部分，占30% -->
      <van-popover
        v-model="showPopover"
        theme="dark"
        trigger="click"
        :actions="actions"
        @select="onSelect"
      >
        <template #reference>
          <van-button type="primary">维护</van-button>
        </template>
      </van-popover>
    </div>
      
      <van-popup v-model:show="showTop" position="bottom"  :style="{ height: '50%' }" @click-overlay="showTop = false;">
          <van-form @submit="onSubmit">
              <van-cell-group inset>
                  <van-field
                      v-model="sub_model"
                      name="规格"
                      label="规格"
                      placeholder="规格"
                      :rules="[{ required: true, message: '请填写规格' }]"
                  />
                  <van-field
                      v-model="sub_price"
                      type="number"
                      name="价格"
                      label="价格"
                      placeholder="价格"
                      :rules="[{ required: true, message: '请填写价格' }]"
                  />
                  
              </van-cell-group>
              <div style="margin: 16px;">
                  <van-button round block type="primary" native-type="submit">
                  提交
                  </van-button>
              </div>
          </van-form>
      </van-popup>
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
          <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="onLoad"
          >
          <van-card
          v-for="item in list"
          :price="item.price"
          :title="item.ep"
          style="--van-card-font-size: 0.4rem;"
          >
          
          <template #footer>
              <van-button
              size="small" @click = "click_mod(item)"
              >修改</van-button>
              <van-button size="small" @click = "click_del(item)">删除</van-button>
          </template>
        </van-card>
      </van-list>
      </van-pull-refresh>
      <van-dialog v-model:show="modshow" title="修改" show-cancel-button :confirmButtonDisabled="modvalue.length>0?false:true" @confirm="confirmMod">
        <van-field v-model="modvalue" placeholder="请输入规格" maxlength="45" @update:model-value="onUpdate"/>
        <van-field v-model="modvalue1" type="number" placeholder="请输入价格" maxlength="45"/>
      </van-dialog>
      
  </template>
  
  <script setup>
  
  import { ref, onMounted, watch, computed, nextTick } from 'vue';
  import { showToast, showConfirmDialog, showDialog  } from 'vant'
  import Pinyin from 'pinyin-match';
  import * as XLSX from 'xlsx';
  
  import { saveAs } from 'file-saver';
  import http from '@/api/request';
  const isProcessing = ref(false);
  const isuploading = ref(false)
  const button_text = ref('系列船');
  const list = ref([])
  const ser_list = ref([])
  const page = ref(-1)
  const loading = ref(false)
  const finished = ref(false)
  const refreshing = ref(false);
  const showTop = ref(false)
  const sub_model = ref('')
  const sub_price = ref('')
  const sw = ref('')
  const showPopover = ref(false)
  const popoverPlacement = ref('left-end')
  const actions =  ref([{ text: '直接新增' }, { text: '下载模版' }, { text: '上传文件' }])
  const uploader = ref(null);
  const modshow = ref(false);
  const modvalue = ref('');
  const modvalue1 = ref('');
  const up_item = ref(null);
  const showTop1 = ref(false);
  const search_word = ref('');
  const fileList = ref([]);
  const showUploadConfirm = ref(false);
  const parsedData = ref([]);
  const onClickLeft = () => history.back();
  const search = async () => {
    try {
      const response = await http.post('/api/search_proj_list',{sw: search_word.value});

      console.log('请求成功:', response);
      button_text.value = response.data[0].projname;
      ser_list.value = response.data.map(item => ({
        id: item.id,
        name: item.projname,
      }));
    } catch (error) {
      console.error('请求失败:', error);
      // 处理错误
    }
};
const select = async(item) => {
  console.log('select: ',item)
    button_text.value = item.name;
    onRefresh()
    showTop1.value = false;
};
const handleClick = () => {
    showTop1.value = true;
};
  const search_sw = async () => {
      page.value = -1
      list.value = []
      console.log(sw.value)
      await onLoad()
  }
  
  const onFileRead = async (file) => {
      isProcessing.value = true;
      try {
        // 读取Excel文件
        const data = await readExcelFile(file.file);
        
        // 检查列头
        if (!validateHeaders(data[0])) {
          showToast('Excel文件必须包含"设备代号"和"总价"列');
          return;
        }
        parsedData.value = processExcelData(data);
        showUploadConfirm.value = true;
        console.log('解析excel:',parsedData.value)
      } catch (error) {
        console.error('文件解析失败:', error);
        showToast('文件解析失败，请检查文件格式');
      } finally {
        isProcessing.value = false; // 处理完成，隐藏遮罩
      }
  };

  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  const validateHeaders = (firstRow) => {
    const headers = Object.keys(firstRow || {});
    return headers.includes('设备代号') && headers.includes('总价');
  };

  const processExcelData = (data) => {
    const resultMap = new Map();
    
    // 跳过第一行(标题行)，遍历所有数据行
    data.slice(1).forEach(row => {
      const model = row['设备代号'];
      const price = parseFloat(row['总价']) || 0;
      
      if (!model) return; // 跳过设备代号为空的行
      
      if (resultMap.has(model)) {
        // 如果已有相同设备代号，累加价格
        resultMap.set(model, resultMap.get(model) + price);
      } else {
        // 新设备代号，添加到map
        resultMap.set(model, price);
      }
    });
    
    // 转换为数组格式
    return Array.from(resultMap.entries()).map(([model, price]) => ({
        model,
        price
      }));
  };

  const confirmUpload = async () => {
    isProcessing.value = true; // 开始上传，显示遮罩
    showUploadConfirm.value = false;
    try {
      if (parsedData.value.length === 0) {
        showToast('没有有效数据可上传');
        return;
      }
      
      showToast('正在上传...');
      
      const response = await http.post('/api/upload-epprice', {
        epdata: parsedData.value,
        series: button_text.value
      });
      
      console.log('上传成功:', response.data);
      showToast('上传成功');
      onRefresh(); // 刷新列表
      
    } catch (error) {
      console.error('上传失败:', error);
      showToast('上传失败');
    } finally {
      isProcessing.value = false; 
      showUploadConfirm.value = false;
      parsedData.value = [];
    }
  };
  
  const click_mod = (item) => {
    console.log('click_mod: ',item)
    modshow.value = true;
    up_item.value = item
  }
  
  const click_del = (item) => {
    console.log('click_del: ',item)
    showConfirmDialog({
    title: '标题',
    message:
      '确认删除么？',
    })
    .then(async() => {
      // on confirm
      const res = await http.post('/api/ep_price_del', {
        id: item.id
      });
      if (res.data.affectedRows === 1) {
        showToast('删除成功');
        onRefresh();
      } else {
        // 后端返回的错误信息
        showToast(`删除失败: ${res.data.message}`);
      }
    })
    .catch(() => {
      // on cancel
    });
  }
  
  const onUpdate = () => {
    // console.log('onUpdate: ',modvalue.value)
    modvalue.value = modvalue.value.toUpperCase( )
  }
  
  const confirmMod = async () => {
    try {
      const res = await http.post('/api/ep_price_mod', {
        id: up_item.value.id,
        model: modvalue.value,
        price: modvalue1.value,
      });
      // 成功处理
      if (res.data.affectedRows === 1) {
        showToast('修改成功');
        modshow.value = false;
        onRefresh();
      } else {
        // 后端返回的错误信息
        showToast(`修改失败: ${res.data.message}`);
      }
    } catch (error) {
      // 捕获请求或服务器的错误
      const errorMessage = error.response?.data?.message || '网络错误，请稍后再试';
      showToast(`修改失败: ${errorMessage}`);
    }
  };
  
  const onSubmit = async () => {
    try {
      console.log(sub_model.value, sub_price.value);
      const res = await http.post('/api/ep_price_submit', {
        model: sub_model.value,
        price: sub_price.value,
      });
  
      // 成功处理
      if (res.data.affectedRows === 1) {
        showToast('提交成功');
        showTop.value = false;
        await onLoad();
      } else {
        // 后端返回的错误信息
        showToast(`提交失败: ${res.data.message}`);
      }
    } catch (error) {
      // 捕获请求或服务器的错误
      const errorMessage = error.response?.data?.message || '网络错误，请稍后再试';
      showToast(`提交失败: ${errorMessage}`);
    }
  };
  
  const onSelect=async(action) => {
    showToast(action.text);
    if (action.text == '直接新增') {
      showTop.value = true
    }else if (  action.text == '下载模版') {
      // 下载模版
      const data = [
        { '设备': '', '价格': 0.00}
      ];
  
      // 创建工作簿
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  
      // 导出并保存为 xlsx 文件
      const xlsxData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([xlsxData], { type: 'application/octet-stream' });
  
      // 使用 file-saver 保存文件
      saveAs(blob, '设备定额.xlsx');
  
    }else if (  action.text == '上传文件') {
      // 上传文件
      await nextTick(); // 确保 DOM 已经更新
      const inputElement = uploader.value.$el.querySelector('input[type="file"]');
      if (inputElement) {
        inputElement.click();
      }
    }
  }
  
  const onRefresh = () => {
        // 清空列表数据
        finished.value = false;
        page.value = 0; // 重置页码
        // 清空列表数据
        list.value = [];
        // 重新加载数据
        // 将 loading 设置为 true，表示处于加载状态
        loading.value = true;
        onLoad();
    };
  
  const onLoad = async () => {
        if(button_text.value == '系列船') {
          await search();
        }
          page.value++; // 增加页码 
          
          if (refreshing.value) {
            page.value = 0
            list.value = [];
            refreshing.value = false;
          }
          
          const responseData = await fetchData();
          if (!responseData) {
            loading.value = false; // 确保加载状态被重置
            return;
          }
          console.log('返回电缆值：', responseData.totalCount,responseData.data);
          for (let i = 0; i < responseData.data.length; i++) {
            list.value.push(responseData.data[i]);
          }
          loading.value = false;
  
          if (list.value.length >= responseData.totalCount) {
            finished.value = true;
          }
        
      };
  
  const fetchData = async () => {
      loading.value = true
      const res = await http.post('/api/ep_price', {
              page: page.value*10,
              sw: sw.value
      })
      // list.value = res.data
      
      // loading.value = false
      return res
  }
  
  
  onMounted( async() => {
      
      // await onLoad();
      console.log("首页加载啦; ");
   
    })
  
  </script>
  
  <style scoped>
  
  .container {
    display: flex; /* 使用 Flex 布局 */
    align-items: center; /* 垂直居中 */
    justify-content: space-between; /* 左右分布 */
    gap: 10px; /* 左右之间间距 */
    z-index: 10; 
    position: sticky; 
    top: 0;
  }
  
  .container > :first-child {
    flex: 25%; /* 左侧占70% */
  }
  
  .container > :last-child {
    flex: 20%; /* 右侧占30% */
    display: flex;
    margin-right: 0.3rem;
    justify-content: flex-end; /* 按钮在右对齐 */
  }

  .loading-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.loading-wrapper .van-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

/* 禁用状态样式 */
.nav-bar-disabled {
  opacity: 0.5;
  pointer-events: none;
}

.custom-dialog {
  .van-dialog__footer {
    display: flex !important;  
  }
  
  .van-dialog__confirm,
  .van-dialog__cancel {
    display: block !important; 
  }
}
  </style>