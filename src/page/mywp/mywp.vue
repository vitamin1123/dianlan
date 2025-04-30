<template>
  <van-nav-bar
    title="确认工单"
    left-text="返回"
    left-arrow
    @click-left="onClickLeft"
  />
  <div class="header">
    <van-cell title="工单日期" :value="date" @click="show = true" style="width:100%" />
    <van-calendar v-model:show="show" :min-date="minDate" :max-date="maxDate" @confirm="onConfirm" />
  </div>
  <div style="margin-bottom: 1rem;">
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
      <!-- <pre style="font-size: 12px; background: #f5f5f5; padding: 10px; margin: 10px;">
        {{ JSON.stringify(groupedData, null, 2) }}
      </pre> -->
        <!-- 按 user 分组 -->
        <van-collapse v-model="activeNames">
          <van-collapse-item
            v-for="(userGroup, userIndex) in groupedData"
            :key="userGroup.usercode"
            :name="'user-' + userGroup.usercode"
          >
          <template #title>
            <div class="user-header">
              <span class="user-name">{{ userGroup.user_name  }}</span>
              <span class="cable-count">
                {{ userGroup.totalCount }} / {{ userGroup.completedCount }} 条
              </span>
            </div>
          </template>

            <!-- 按 last_fangxian_loca_name 分组 -->
            <div v-for="(completedItem, itemIndex) in userGroup.completedItems" :key="itemIndex">
              <!-- 位置名称 -->
              <div class="location-title">{{ completedItem.location || '未指定位置' }}</div>
              
              <!-- 遍历设施（使用 Object.values 转换对象为数组） -->
              <div v-for="(facilityGroup, facIndex) in Object.values(completedItem.facilities)" :key="facIndex">
                <div class="facility-title">{{ facilityGroup.facility || '未指定设施' }}</div>
                
                <!-- 电缆列表 -->
                <div v-for="(item, cableIndex) in facilityGroup.items" :key="cableIndex" class="cable-item">
                  <div class="cable-info">
                    <span class="cable-title">{{ item.daihao }}</span>
                    <span class="cable-desc">{{ item.model }} {{ item.specification }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 操作按钮（针对整个用户） -->
            <div class="action-buttons">
              <van-button 
                type="primary" 
                size="small" 
                @click.stop="handleViewImages(userGroup.usercode)"
                style="margin-right: 8px;"
              >
                查看图片
              </van-button>
              <van-button 
                type="danger" 
                size="small" 
                @click.stop="handleReject(userGroup.usercode)"
                style="margin-right: 8px;"
              >
                驳回
              </van-button>
              <van-button 
                type="success" 
                size="small" 
                @click.stop="handleConfirm(userGroup.usercode)"
              >
                确认
              </van-button>
            </div>
          </van-collapse-item>
        </van-collapse>
      </van-list>
    </van-pull-refresh>
  </div>
  <van-popup
    v-model:show="showImagePreview"
    position="bottom"
    round
    :style="{ height: '80%' }"
  >
    <van-nav-bar
      title="工作照片"
      left-text="关闭"
      left-arrow
      @click-left="showImagePreview = false"
    />
    
    <div class="image-preview-container">
      <van-checkbox-group v-model="selectedImages">
        <van-grid :border="false" :column-num="3">
          <van-grid-item 
            v-for="(image, index) in userImages" 
            :key="index"
            @click="previewSingleImage(index)"
          >
            <van-checkbox 
              :name="image" 
              shape="square" 
              @click.stop
              class="image-checkbox"
            />
            <van-image
              :src="image"
              fit="cover"
              height="100"
              lazy-load
            />
          </van-grid-item>
        </van-grid>
      </van-checkbox-group>
    </div>
    
    <div class="image-actions">
      <van-button 
        type="primary" 
        block 
        @click="shareToWechat"
        :disabled="selectedImages.length === 0"
      >
        分享选中图片 ({{ selectedImages.length }})
      </van-button>
    </div>
  </van-popup>
  
  <!-- 单张图片预览 -->
  <van-image-preview
    v-model:show="showSinglePreview"
    :images="userImages"
    :start-position="singlePreviewIndex"
  />
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import http from '@/api/request';
import { showNotify, showConfirmDialog } from 'vant';
import { useUserStore } from '@/store/userStore';
import { useDaibanStore } from '@/store/daibanStore';
import { baseURL } from "@/api/my-account";
const showImagePreview = ref(false);
const userImages = ref([]);
const selectedImages = ref([]);
const showSinglePreview = ref(false);
const singlePreviewIndex = ref(0);


const userStore = useUserStore();
const daibanStore = useDaibanStore();
const list = ref([]);
const todayDate = new Date().toLocaleDateString('en-CA').replace(/-/g, '/'); 
const date = ref(todayDate);
const show = ref(false);
const maxDate = ref(new Date());
const minDate = ref(new Date());
const activeNames = ref([]);

minDate.value.setDate(maxDate.value.getDate() - 30);

const formatDate = (date) => {
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
};

const onClickLeft = () => history.back();

const onConfirm = async(value) => {
  show.value = false;
  date.value = formatDate(value);
  list.value = [];
  page.value = 0;
  await onLoad();
};

// 查看图片方法
const handleViewImages = async (fin_user) => {
  try {
    const res = await http.post('/api/get_today_uploaded', { 
      userCode: fin_user 
    });
    
    if (res.data && res.data.length > 0) {
      // 假设返回的图片路径是相对路径，需要拼接完整URL
      userImages.value = res.data[0].image_paths.split(',').map(path => {
        return `${baseURL}/public/img/${path.trim()}`;
      });
      selectedImages.value = [];
      showImagePreview.value = true;
    } else {
      showNotify({ type: 'warning', message: '该用户今日未上传图片' });
    }
  } catch (error) {
    console.error('获取图片失败:', error);
    showNotify({ type: 'danger', message: '获取图片失败' });
  }
};

// 预览单张图片
const previewSingleImage = (index) => {
  singlePreviewIndex.value = index;
  showSinglePreview.value = true;
};

// 分享到微信
const shareToWechat = () => {
  // 这里需要根据实际微信SDK或分享API实现
  // 示例代码，实际实现可能需要调用微信JS-SDK
  console.log('分享图片:', selectedImages.value);
  showNotify({ type: 'success', message: '准备分享到微信' });
  
  // 实际项目中可能需要这样：
  // wx.ready(() => {
  //   wx.previewImage({
  //     current: selectedImages.value[0],
  //     urls: selectedImages.value
  //   });
  // });
};

// 按 user → last_fangxian_loca_name → facilities_name 分组


// 驳回操作（针对整个用户）
const handleReject = (fin_user) => {
  showConfirmDialog({
    title: '确认驳回',
    message: `确定要驳回 ${fin_user} 的所有工单吗？`,
  }).then(() => {
    console.log('驳回用户:', fin_user);
    showNotify({ type: 'success', message: '已驳回' });
  }).catch(() => {
    showNotify({ type: 'info', message: '已取消' });
  });
};

const groupedData = computed(() => {
  const userGroups = {};
  
  list.value.forEach(item => {
    if (!item.usercode) return;

    // 初始化用户组
    if (!userGroups[item.usercode]) {
      userGroups[item.usercode] = {
        usercode: item.usercode,
        user_name: item.user_name || item.user || item.usercode,
        totalCount: 0,
        completedCount: 0,
        completedItems: []
      };
    }

    const userGroup = userGroups[item.usercode];
    userGroup.totalCount++;

    // 关键点：检查 fin_user 是否等于当前 usercode
    if (item.fin_user === item.usercode) {
      userGroup.completedCount++;

      const locationKey = item.last_fangxian_loca_name || '未指定位置';
      const facilityKey = item.facilities_name || '未指定设施';

      // 查找或创建位置分组
      let locationGroup = userGroup.completedItems.find(g => g.location === locationKey);
      if (!locationGroup) {
        locationGroup = { location: locationKey, facilities: {} };
        userGroup.completedItems.push(locationGroup);
      }

      // 查找或创建设施分组
      if (!locationGroup.facilities[facilityKey]) {
        locationGroup.facilities[facilityKey] = {
          facility: facilityKey,
          items: []
        };
      }

      locationGroup.facilities[facilityKey].items.push(item);
    }
  });

  return Object.values(userGroups);
});

// 确认操作（针对整个用户）
const handleConfirm = (fin_user) => {
  showConfirmDialog({
    title: '确认工单',
    message: `确定要确认 ${fin_user} 的所有工单吗？`,
  }).then(() => {
    console.log('确认用户:', fin_user);
    showNotify({ type: 'success', message: '已确认' });
  }).catch(() => {
    showNotify({ type: 'info', message: '已取消' });
  });
};

const page = ref(0);
const finished = ref(false);
const loading = ref(false);
const refreshing = ref(false);

const onRefresh = async () => {
  refreshing.value = true;
  page.value = 0;
  list.value = [];
  await onLoad();
  refreshing.value = false;
};

const onLoad = async () => {
  if (refreshing.value) {
    page.value = 0;
    list.value = [];
  }

  const url = '/api/get_paip_wp_list';
  const data = {
    userCode: userStore.userInfo.userCode,
    page: page.value * 10,
    qdate: date.value
  };

  try {
    const response = await http.post(url, data);
    const formattedData = response.data.map((item) => {
      const date = new Date(item.wpdate);
      const datePart = date.toISOString().split('T')[0];
      const timePart = date.toISOString().split('T')[1].slice(0, 5);
      return {
        ...item,
        formattedWpdate: `${datePart} ${timePart}`,
      };
    });

    list.value.push(...formattedData);

    if (list.value.length >= response.totalCount) {
      finished.value = true;
    }
  } catch (error) {
    console.error('请求失败:', error);
  } finally {
    loading.value = false;
  }

  page.value++;
};

onMounted(() => {
  get_wp_todo_cnt();
});

const get_wp_todo_cnt = async () => {
  const res = await http.post('/api/get_paip_wp_todo_cnt', { userCode: userStore.userInfo.userCode });
  daibanStore.daiban = res.data;
};
</script>

<style scoped>
/* 新增折叠面板标题样式 */
:deep(.van-collapse-item__title) {
  font-size: 18px;  /* 增大标题字体 */
}

.user-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding-right: 16px;
}

.user-name {
  font-weight: bold;
  font-size: 0.3rem;  /* 增大用户名字体 */
}

.cable-count {
  color: #666;
  font-size: 24px;
}

.cable-count::before {
  content: "总计/完成：";
  color: #999;
  font-size: 20px;
}

.location-title {
  font-weight: bold;
  padding: 8px 16px;
  background-color: #f5f5f5;
  margin-top: 8px;
}

.facility-title {
  padding: 6px 16px;
  background-color: #f9f9f9;
  color: #666;
  font-size: 24px;
}

.cable-item {
  margin: 4px 16px;
  padding: 8px;
  background-color: #fff;
  border-radius: 4px;
  border: 1px solid #eee;
}

.cable-info {
  display: flex;
  flex-direction: column;
}

.cable-title {
  font-weight: bold;
  font-size: 20px;
}

.cable-desc {
  font-size: 12px;
  color: #666;
  margin: 2px 0;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
  padding: 8px 16px;
}

/* 调整折叠面板样式 */
:deep(.van-collapse-item__content) {
  padding: 0;
}

/* 图片预览容器 */
.image-preview-container {
  height: calc(100% - 100px);
  overflow-y: auto;
  padding: 10px;
}

/* 图片复选框 */
.image-checkbox {
  position: absolute;
  top: 5px;
  right: 5px;
  z-index: 2;
}

/* 图片操作区域 */
.image-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px;
  background: white;
  border-top: 1px solid #eee;
}

/* 调整图片网格项 */
:deep(.van-grid-item__content) {
  padding: 5px;
  position: relative;
}

/* 调整图片样式 */
:deep(.van-image) {
  border-radius: 4px;
  overflow: hidden;
}
</style>