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
          <!-- 按 wpid 分组 -->
          <van-collapse v-model="activeNames">
            <van-collapse-item
              v-for="(wpGroup, wpIndex) in groupedData"
              :key="wpGroup.wpid"
              :name="'wp-' + wpGroup.wpid"
            >
              <template #title>
                <div class="wp-header">
                  <div class="wp-info">
                    <span class="wp-id">工单号: {{ wpGroup.wpid }}</span>
                    <span class="wp-date">{{ wpGroup.wpdate }}</span>
                  </div>
                  <div class="wp-meta">
                    <div class="wp-owner">
                      <van-tag type="primary">负责人: {{ wpGroup.wpowner }}</van-tag>
                    </div>
                    <van-button 
                      size="small" 
                      icon="plus" 
                      @click.stop="showAddUserDialog(wpGroup)"
                      class="add-user-btn"
                    >
                      添加人员
                    </van-button>
                  </div>
                </div>
              </template>
  
              <!-- 按 last_fangxian_loca_name 分组 -->
              <div v-for="(locationGroup, locIndex) in wpGroup.locations" :key="locIndex">
                <div class="location-title">{{ locationGroup.location || '未指定位置' }}</div>
  
                <!-- 按 facilities_name 分组 -->
                <div v-for="(facilityGroup, facIndex) in locationGroup.facilities" :key="facIndex">
                  <div class="facility-title">{{ facilityGroup.facility || '未指定设施' }}</div>
  
                  <!-- 电缆列表 -->
                  <div v-for="(item, itemIndex) in facilityGroup.items" :key="itemIndex" class="cable-item">
                    <div class="cable-info">
                      <span class="cable-title">{{ item.daihao }}</span>
                      <span class="cable-desc">{{ item.model }} {{ item.specification }}</span>
                      <div class="user-tags">
                        <van-tag v-if="item.user" type="success">{{ item.user }}</van-tag>
                        <van-tag v-if="item.fin_user_name" type="warning">{{ item.fin_user_name }}</van-tag>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </van-collapse-item>
          </van-collapse>
        </van-list>
      </van-pull-refresh>
    </div>
  
    <!-- 添加人员对话框 - 简化版，只显示picker -->
    <van-popup 
      v-model:show="showUserDialog" 
      position="bottom"
      round
    >
      <van-picker
        :columns="filteredUserOptions"
        @confirm="confirmAddUser"
        show-toolbar
        title="选择人员"
        @cancel="showUserDialog = false"
      />
    </van-popup>
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
  const showUserDialog = ref(false);
  const userOptions = ref([]);
  const selectedUser = ref(null);
  const currentWpGroup = ref(null);
  
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
  
  // 获取所有用户
  const getAllUsers = async () => {
    try {
      const response = await http.get('/api/get_all_user');
      userOptions.value = response.data.map(user => ({
        text: `${user.username} (${user.usercode})`,
        value: user.usercode,
        username: user.username
      }));
    } catch (error) {
      console.error('获取用户列表失败:', error);
      showNotify({ type: 'danger', message: '获取用户列表失败' });
    }
  };
  
  // 过滤掉已在工单中的用户
  const filteredUserOptions = computed(() => {
    if (!currentWpGroup.value) return userOptions.value;
    
    // 获取当前工单中已存在的所有usercode
    const existingUserCodes = new Set();
    for (const location of Object.values(currentWpGroup.value.locations)) {
      for (const facility of Object.values(location.facilities)) {
        for (const item of facility.items) {
          if (item.usercode) existingUserCodes.add(item.usercode);
          if (item.fin_user) existingUserCodes.add(item.fin_user);
        }
      }
    }
    
    return userOptions.value.filter(
      user => !existingUserCodes.has(user.value)
    );
  });
  
  // 显示添加人员对话框
  const showAddUserDialog = (wpGroup) => {
    currentWpGroup.value = wpGroup;
    showUserDialog.value = true;
  };
  
  // 确认添加人员
  const confirmAddUser = ({ selectedOptions }) => {
    if (!selectedOptions || selectedOptions.length === 0 || !currentWpGroup.value?.wpid) return;
  
    const selectedUser = selectedOptions[0];
    
    showConfirmDialog({
      title: '确认添加',
      message: `确定要添加 ${selectedUser.username} 到工单吗？`,
    }).then(async () => {
      try {
        const response = await http.post('/api/add_wp_user', {
          wpid: currentWpGroup.value.wpid,
          usercode: selectedUser.value
        });
        
        if (response.data.affectedRows > 0) {
          showNotify({ type: 'success', message: `已添加 ${selectedUser.username} 到工单` });
          // 刷新数据
          onRefresh();
        } else {
          showNotify({ type: 'danger', message: response.message || '添加人员失败' });
        }
      } catch (error) {
        console.error('添加人员失败:', error);
        showNotify({ type: 'danger', message: '添加人员失败' });
      } finally {
        showUserDialog.value = false;
      }
    }).catch(() => {
      showNotify({ type: 'info', message: '已取消' });
    });
  };
  
  // 按 wpid → last_fangxian_loca_name → facilities_name 分组
  const groupedData = computed(() => {
    const wpGroups = {};
    
    list.value.forEach(item => {
      if (!item.wpid) return;
      
      // 初始化工单组
      if (!wpGroups[item.wpid]) {
        wpGroups[item.wpid] = {
          wpid: item.wpid,
          wpdate: item.formattedWpdate || item.wpdate,
          wpowner: item.wpowner,
          locations: {}
        };
      }
      
      const wpGroup = wpGroups[item.wpid];
      
      // 按位置分组
      const locationKey = item.last_fangxian_loca_name || '未指定位置';
      if (!wpGroup.locations[locationKey]) {
        wpGroup.locations[locationKey] = {
          location: locationKey,
          facilities: {}
        };
      }
      
      const locationGroup = wpGroup.locations[locationKey];
      
      // 按设施分组
      const facilityKey = item.facilities_name || '未指定设施';
      if (!locationGroup.facilities[facilityKey]) {
        locationGroup.facilities[facilityKey] = {
          facility: facilityKey,
          items: []
        };
      }
      
      locationGroup.facilities[facilityKey].items.push(item);
    });
    
    return Object.values(wpGroups);
  });
  
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
    getAllUsers();
  });
  
  const get_wp_todo_cnt = async () => {
    const res = await http.post('/api/get_paip_wp_todo_cnt', { userCode: userStore.userInfo.userCode });
    daibanStore.daiban = res.data;
  };
  </script>
  
  <style scoped>
  .wp-header {
    display: flex;
    flex-direction: column;
    width: 100%;
    padding-right: 8px;
  }
  
  .wp-info {
    display: flex;
    flex-direction: column;
    flex: 1;
  }
  
  .wp-id {
    font-weight: bold;
    font-size: 14px;
    margin-bottom: 4px;
  }
  
  .wp-date {
    font-size: 16px;
    color: #666;
    margin-bottom: 8px;
  }
  
  .wp-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .wp-owner {
    margin: 0;
  }
  
  .add-user-btn {
    width: auto;
    padding: 0 12px;
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
  
  .user-tags {
    margin-top: 4px;
  }
  
  .user-tags .van-tag {
    margin-right: 4px;
  }
  
  /* 调整折叠面板样式 */
  :deep(.van-collapse-item__content) {
    padding: 0;
  }
  </style>