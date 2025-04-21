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
        <!-- 按 user 分组 -->
        <van-collapse v-model="activeNames">
          <van-collapse-item
            v-for="(userGroup, userIndex) in groupedData"
            :key="userGroup.user"
            :name="'user-' + userGroup.user"
          >
          <template #title>
            <div class="user-header">
              <span class="user-name">{{ userGroup.fin_user_name }}</span>
              <span class="cable-count">
                {{ userGroup.totalCount }} / {{ userGroup.completedCount }} 条
              </span>
            </div>
          </template>

            <!-- 按 last_fangxian_loca_name 分组 -->
            <div v-for="(locationGroup, locIndex) in userGroup.locations" :key="locIndex">
              <div class="location-title">{{ locationGroup.location || '未指定位置' }}</div>

              <!-- 按 facilities_name 分组 -->
              <div v-for="(facilityGroup, facIndex) in locationGroup.facilities" :key="facIndex">
                <div class="facility-title">{{ facilityGroup.facility || '未指定设施' }}</div>

                <!-- 电缆列表 -->
                <div v-for="(item, itemIndex) in facilityGroup.items" :key="itemIndex" class="cable-item">
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
                type="danger" 
                size="small" 
                @click.stop="handleReject(userGroup.fin_user)"
                style="margin-right: 8px;"
              >
                驳回
              </van-button>
              <van-button 
                type="success" 
                size="small" 
                @click.stop="handleConfirm(userGroup.fin_user)"
              >
                确认
              </van-button>
            </div>
          </van-collapse-item>
        </van-collapse>
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import http from '@/api/request';
import { showNotify, showConfirmDialog } from 'vant';
import { useUserStore } from '@/store/userStore';
import { useDaibanStore } from '@/store/daibanStore';

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
    if (!item.user) return; // 确保 user 字段存在
    
    // 初始化用户组（以 user 作为分组依据）
    if (!userGroups[item.user]) {
      userGroups[item.user] = {
        user: item.user,          // 用户ID（分组依据）
        fin_user_name: item.fin_user_name, // 显示用用户名
        totalCount: 0,       // 该 user 下的所有电缆数
        completedCount: 0,   // fin_user_name = user 的电缆数
        locations: {}
      };
    }
    
    const userGroup = userGroups[item.user];
    userGroup.totalCount++; // 总电缆数 +1
    
    // 如果 fin_user_name 等于当前分组 user，则计入 completedCount
    if (item.fin_user_name === item.user) {
      userGroup.completedCount++;
    }
    
    // 剩余分组逻辑（按位置 → 设施 → 电缆）
    const locationKey = item.last_fangxian_loca_name || '未指定位置';
    if (!userGroup.locations[locationKey]) {
      userGroup.locations[locationKey] = {
        location: locationKey,
        facilities: {}
      };
    }
    
    const locationGroup = userGroup.locations[locationKey];
    const facilityKey = item.facilities_name || '未指定设施';
    if (!locationGroup.facilities[facilityKey]) {
      locationGroup.facilities[facilityKey] = {
        facility: facilityKey,
        items: []
      };
    }
    
    locationGroup.facilities[facilityKey].items.push(item);
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
.user-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding-right: 16px;
}

.user-name {
  font-weight: bold;
  font-size: 16px;
}

.cable-count {
  color: #666;
  font-size: 14px;
}

.cable-count::before {
  content: "总计/完成：";
  color: #999;
  font-size: 12px;
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
  font-size: 14px;
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
  font-size: 14px;
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
</style>