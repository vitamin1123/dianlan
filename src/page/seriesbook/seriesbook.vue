<template>
  <van-nav-bar
    title="系列船电缆册维护"
    left-text="返回"
    left-arrow
    @click-left="onClickLeft"
  />
  <van-popup v-model:show="showTop1" position="top" :style="{ height: '50%' }" > 
        <van-search v-model="search_word" placeholder="请输入" show-action  @search="search"/>
        <van-list>
            <van-cell v-for="item in ser_list" :key="item.id" :title="item.name" @click="select(item)"/>
        </van-list>
    </van-popup>
  <!-- 磁吸导航 -->
  <van-uploader v-show="false" ref="uploader" v-model="fileList" accept=".xls, .xlsx" :after-read="onFileRead">
    <van-button icon="plus" type="primary">上传文件</van-button> 
  </van-uploader>
  
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
        <van-button type="primary" :loading="isuploading">维护</van-button>
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
        :num="item.num"
       
        :desc="item.model+'  '+ item.specification"
       
        :title="item.daihao"
        
        style="--van-card-font-size: 0.4rem;"
        >
        <template #tags>
          <van-tag v-if="item.proj"  type="primary" style="margin-right: 0.1rem;">{{ 'N'+item.proj.substr(-4) }}</van-tag>
            <van-tag v-if="item.facilities && item.facilities.trim() !== ''" plain type="primary" style="margin-right: 0.1rem;">{{ item.facilities }}</van-tag>
            <van-tag v-if="item.facilities_loca && item.facilities_loca.trim() !== ''"  color="#ffe1e1" text-color="#ad0000" style="margin-right: 0.1rem;">{{ item.facilities_loca }}</van-tag>
            <van-tag v-if="item.facilities_name && item.facilities_name.trim() !== ''" plain color="#7232dd" style="margin-right: 0.1rem;">{{ item.facilities_name }}</van-tag>
            <van-tag v-if="item.last_ope && item.last_ope.trim() !== ''"  type="warning" style="margin-right: 0.1rem;">{{ item.last_ope }}</van-tag>
        </template>
        
        <template #footer>
            <van-button
            size="small" :disabled = "item.state == 1?false:true"
            >{{ item.state == 1?"可用":"禁用" }}</van-button>
            <van-button size="small" @click = "click_del(item)">{{ item.state == 1?"禁用":"启用" }}</van-button>
        </template>
      </van-card>
    </van-list>
    </van-pull-refresh>
    <van-dialog v-model:show="modshow" title="修改" show-cancel-button :confirmButtonDisabled="modvalue.length>0?false:true" @confirm="confirmMod">
      <van-field v-model="modvalue" placeholder="请输入规格" maxlength="45" @update:model-value="onUpdate"/>
      <van-field v-model="modvalue1" type="number" placeholder="请输入价格" maxlength="45"/>
      <van-field v-model="modvalue1" type="number" placeholder="请输入价格" maxlength="45"/>
      <van-field v-model="modvalue1" type="number" placeholder="请输入价格" maxlength="45"/>
      <van-field v-model="modvalue1" type="number" placeholder="请输入价格" maxlength="45"/>
    </van-dialog>
    
</template>

<script setup>

import { ref, onMounted, watch, computed, nextTick } from 'vue';
import { showToast, showConfirmDialog } from 'vant'
import Pinyin from 'pinyin-match';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import http from '@/api/request';
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
const actions =  ref([{ text: '上传文件' },{ text: '删除所有' }])
const uploader = ref(null);
const modshow = ref(false);
const modvalue = ref('');
const modvalue1 = ref('');
const up_item = ref(null);
const showTop1 = ref(false);
const search_word = ref('');
const fileList = ref([]);
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
  //console.log('读取到的文件:', file);
  file.status = 'uploading';
  file.message = '上传中...';
  isuploading.value = true;
  // 校验文件类型
  if (!file.file.name.endsWith('.xlsx') && !file.file.name.endsWith('.xls')) {
    showToast('只支持上传 .xls 或 .xlsx 文件');
    isuploading.value = false;
    return;
  }

  // 校验文件大小（例如限制为 10MB）
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.file.size > maxSize) {
    showToast('文件大小不能超过 10MB');
    isuploading.value = false;
    return;
  }
      const formData = new FormData();
      formData.append('file', file.file);
      formData.append('projname', button_text.value);
      try {
        const response = await http.post('/api/upload-dianlan', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        //console.log('upload: ',response)
        if (response.success) {
          file.status = 'done';
          file.message = '上传成功';
          showToast('上传成功');
          
          onRefresh(); // 刷新数据
        } else {
          file.status = 'failed';
          file.message = response.data.message || '上传失败';
          showToast(`上传失败: ${response.data.message}`);
        }
      } catch (error) {
        console.error('上传失败:', error);
        file.status = 'failed';
        file.message = '上传失败';
        let errorMessage = '上传失败: ';
        if (error.response && error.response.data) {
          errorMessage += error.response.data.message || '未知错误';
        } else {
          errorMessage += error.message || '网络错误';
        }
        showToast(errorMessage);
      }finally {
        isuploading.value = false;
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
  title: '确认',
  message:
    (`确认${item.state == 1?'删除':'启用'}么？`),
  })
  .then(async() => {
    // on confirm
    const res = await http.post('/api/dianlan_del', {
      daihao: item.daihao,
      model: item.model,
      specification: item.specification,
      op_type: item.state
    });
    if (res.data.affectedRows > 0) {
      showToast('成功');
      onRefresh();
    } else {
      // 后端返回的错误信息
      showToast(`失败: ${res.data.message}`);
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
    const res = await http.post('/api/dianlan_baseprice_mod', {
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
    const res = await http.post('/api/dianlan_baseprice_submit', {
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
  if (action.text == '删除所有') {
    // showTop.value = true
    showConfirmDialog({
      title: '确认',
      message:
        (`确认删除所有么？`),
    })
   .then(async() => {
      // on confirm
      const res = await http.post('/api/dianlan_del_all', {
        proj: button_text.value
      });
      if (res.data.affectedRows > 0) {
        showToast('成功');
        onRefresh();
      } else {
        // 后端返回的错误信息
        showToast(`失败: ${res.data.message}`);
      }
    })
  }else if (  action.text == '下载模版') {
    // 下载模版
    const data = [
      { '规格': '', '价格': 0.00}
    ];

    // 创建工作簿
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    // 导出并保存为 xlsx 文件
    const xlsxData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([xlsxData], { type: 'application/octet-stream' });

    // 使用 file-saver 保存文件
    saveAs(blob, '电缆定额.xlsx');

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
      page.value = -1; // 重置页码
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
        console.log('onLoad:',page.value)
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
    const res = await http.post('/api/dianlan_list', {
            page: page.value*10,
            sw: sw.value,
            proj: button_text.value
    })
    // list.value = res.data
    
    // loading.value = false
    return res
}


onMounted( async() => {
   
    
    
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
  margin-right: 0.1rem;
  
}

.container > :last-child {
  flex: 20%; /* 右侧占30% */
  display: flex;
  margin-right: 0.3rem;
  justify-content: flex-end; /* 按钮在右对齐 */
}
</style>