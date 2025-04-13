<template>
  <van-nav-bar
    title="当日产值"
    left-text="返回"
    left-arrow
    @click-left="onClickLeft"
  />
  <div class="container">
    <div class="header">
      <van-cell title="工单日期" :value="date" @click="show = true" style="width:60%" />
      <div class="price-display">
        <div class="price-line">
          <span>已确认：</span>
          <span>￥{{ totalConfirmedPrice.toFixed(2) }}</span>
        </div>
        <div class="price-line">
          <span>总产值：</span>
          <span>￥{{ totalCheckedPrice.toFixed(2) }}</span>
        </div>
      </div>
      <van-calendar v-model:show="show" :min-date="minDate" :max-date="maxDate" @confirm="onConfirm" />
    </div>

    <van-tabs v-model:active="activeTab">
      <van-tab title="设备">
        <!-- 第一层 Tab: 按项目分组 -->
        <van-tabs v-model:active="projTabActive" v-if="activeTab === 0">
          <van-tab v-for="proj in projItems" :title="proj.title" :key="proj.key">
            <!-- 第二层 Tab: 按放线位置分组 -->
            <van-tabs v-model:active="locationTabActive" v-if="activeTab === 0 && projTabActive === proj.index">
              <van-tab v-for="location in locationItems" :title="location.title" :key="location.key">
                <!-- 第三层 Tab: 按设备位置分组 -->
                <van-tabs v-model:active="facilityLocaTabActive" v-if="activeTab === 0 && projTabActive === proj.index && locationTabActive === location.index">
                  <van-tab v-for="facilityLoca in facilityLocaItems" :title="facilityLoca.title" :key="facilityLoca.key">
                    <!-- TreeSelect 组件 -->
                    <van-tree-select
                      v-model:main-active-index="activeIndex"
                      v-model:selected="selectedIds"
                      :items="treeItems"
                      height="calc(100vh - 300px)"
                      @click-nav="onNavClick"
                      @click-item="onItemClick"
                    >
                      <template #content>
                        <div v-if="activeFacility">
                          <van-checkbox-group v-model="checked" ref="checkboxGroup" shape="square" @change="checkChange">
                            <van-checkbox 
                              v-for="item in activeFacilityChildren"
                              :key="item.dianlanid"
                              :name="item.id+'Φ'+item.wpid" 
                              :disabled="(item.fin_user != null && item.fin_user != userStore.userInfo.userCode)|| date != todayDate || item.state == 1"
                              class="checkbox"
                            >
                              <van-card
                                :num="item.num"
                                :desc="item.model+'  '+ item.specification"
                                :title="item.daihao"
                                style="--van-card-font-size: 0.4rem;--van-card-padding: 0.1rem 0.1rem"
                              >
                                <template #tags>
                                  <van-tag v-if="item.proj" type="primary" style="margin-right: 0.1rem;">{{ 'N'+item.proj.substr(-4) }}</van-tag>
                                  <van-tag v-if="item.facilities_loca && item.facilities_loca.trim() !== ''" color="#ffe1e1" text-color="#ad0000" style="margin-right: 0.1rem;">{{ item.facilities_loca }}</van-tag>
                                  <van-tag v-if="item.fin_user_name" color="#008866">{{ "接线:"+item.fin_user_name }}</van-tag>
                                </template>
                              </van-card>
                            </van-checkbox>
                          </van-checkbox-group>
                        </div>
                        <div v-else class="empty-tip">
                          请选择设备
                        </div>
                      </template>
                    </van-tree-select>
                  </van-tab>
                </van-tabs>
              </van-tab>
            </van-tabs>
          </van-tab>
        </van-tabs>
      </van-tab>
      <van-tab title="电缆">
        <van-checkbox-group v-model="checked" ref="checkboxGroup" shape="square" @change="checkChange">
          <van-checkbox 
            v-for ="item in list"
            :key = "item.dianlanid"
            :name="item.id+'Φ'+item.wpid" 
            :disabled="(item.fin_user != null && item.fin_user != userStore.userInfo.userCode)|| date != todayDate || item.state == 1"
            class="checkbox"
          >
            <van-card
              :num="item.num"
              :desc="item.model+'  '+ item.specification"
              :title="item.daihao"
              style="--van-card-font-size: 0.4rem;--van-card-padding: 0.1rem 0.1rem"
            >
              <template #tags>
                <van-tag v-if="item.proj" type="primary" style="margin-right: 0.1rem;">{{ 'N'+item.proj.substr(-4) }}</van-tag>
                <van-tag v-if="item.facilities && item.facilities.trim() !== ''" plain type="primary" style="margin-right: 0.1rem;">{{ item.facilities }}</van-tag>
                <van-tag v-if="item.facilities_loca && item.facilities_loca.trim() !== ''" color="#ffe1e1" text-color="#ad0000" style="margin-right: 0.1rem;">{{ item.facilities_loca }}</van-tag>
                <van-tag v-if="item.facilities_name && item.facilities_name.trim() !== ''" plain color="#7232dd" style="margin-right: 0.1rem;">{{ item.facilities_name }}</van-tag>
                <van-tag v-if="item.fin_user_name" color="#008866">{{ "接线:"+item.fin_user_name }}</van-tag>
              </template>
            </van-card>
          </van-checkbox>
        </van-checkbox-group>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useUserStore } from '@/store/userStore';
import { useDaibanStore } from '@/store/daibanStore'
import { showToast, showConfirmDialog } from 'vant';
import http from '@/api/request';

const userStore = useUserStore();
const daibanStore = useDaibanStore();
const checked = ref([]);
const list = ref([]);
const checkboxGroup = ref(null);
const todayDate = new Date().toLocaleDateString('en-CA').replace(/-/g, '/');
const isInitialLoad = ref(true);
const date = ref(todayDate);
const maxDate = ref(new Date());
const minDate = ref(new Date());
minDate.value.setDate(maxDate.value.getDate() - 30);
const show = ref(false);
const previousCheckedValues = ref([]);
const totalConfirmedPrice = ref(0);
const totalCheckedPrice = ref(0);
const activeTab = ref(0);

// 多层 Tab 相关状态
const projTabActive = ref(0);
const locationTabActive = ref(0);
const facilityLocaTabActive = ref(0);
const activeIndex = ref(0);
const selectedIds = ref([]);

const onClickLeft = () => history.back();

// 计算项目分组
const projItems = computed(() => {
  const projs = new Set();
  list.value.forEach(item => {
    if (item.proj_item) {
      projs.add(item.proj_item);
    }
  });
  
  return Array.from(projs).map((proj, index) => ({
    title: proj,
    key: proj,
    index: index
  }));
});

// 计算放线位置分组
const locationItems = computed(() => {
  const locations = new Set();
  const currentProj = projItems.value[projTabActive.value]?.key;
  
  list.value.forEach(item => {
    if (item.proj_item === currentProj && item.last_fangxian_loca_name) {
      locations.add(item.last_fangxian_loca_name);
    }
  });
  
  return Array.from(locations).map((location, index) => ({
    title: location,
    key: location,
    index: index
  }));
});

// 计算设备位置分组
const facilityLocaItems = computed(() => {
  const locas = new Set();
  const currentProj = projItems.value[projTabActive.value]?.key;
  const currentLocation = locationItems.value[locationTabActive.value]?.key;
  
  list.value.forEach(item => {
    if (item.proj_item === currentProj && 
        item.last_fangxian_loca_name === currentLocation && 
        item.facilities_loca) {
      locas.add(item.facilities_loca);
    }
  });
  
  return Array.from(locas).map((loca, index) => ({
    title: loca,
    key: loca,
    index: index
  }));
});

// 计算树形结构数据 (根据当前选择的项目、放线位置和设备位置过滤)
const treeItems = computed(() => {
  const currentProj = projItems.value[projTabActive.value]?.key;
  const currentLocation = locationItems.value[locationTabActive.value]?.key;
  const currentFacilityLoca = facilityLocaItems.value[facilityLocaTabActive.value]?.key;
  
  const filteredList = list.value.filter(item => 
    item.proj_item === currentProj && 
    item.last_fangxian_loca_name === currentLocation && 
    item.facilities_loca === currentFacilityLoca
  );
  
  const facilitiesMap = {};
  
  // 按设备名称分组
  filteredList.forEach(item => {
    if (!facilitiesMap[item.facilities_name]) {
      facilitiesMap[item.facilities_name] = {
        text: item.facilities_name,
        children: []
      };
    }
    facilitiesMap[item.facilities_name].children.push({
      text: `${item.daihao} (${item.model} ${item.specification})`,
      id: item.id + 'Φ' + item.wpid
    });
  });
  
  // 转换并计算每个设备的选中数量
  return Object.values(facilitiesMap).map(facility => {
    const checkedCount = facility.children.filter(child => 
      checked.value.includes(child.id)
    ).length;
    
    return {
      ...facility,
      badge: checkedCount > 0 ? checkedCount : undefined
    };
  });
});

// 当前选中的设备
const activeFacility = computed(() => {
  if (activeIndex.value >= 0 && treeItems.value[activeIndex.value]) {
    return treeItems.value[activeIndex.value];
  }
  return null;
});

// 当前选中设备的电缆列表
const activeFacilityChildren = computed(() => {
  if (!activeFacility.value) return [];
  
  const currentProj = projItems.value[projTabActive.value]?.key;
  const currentLocation = locationItems.value[locationTabActive.value]?.key;
  const currentFacilityLoca = facilityLocaItems.value[facilityLocaTabActive.value]?.key;
  
  return list.value.filter(item => 
    item.proj_item === currentProj && 
    item.last_fangxian_loca_name === currentLocation && 
    item.facilities_loca === currentFacilityLoca &&
    item.facilities_name === activeFacility.value.text
  );
});

const onNavClick = (index) => {
  activeIndex.value = index;
  selectedIds.value = [];
};

const onItemClick = ({ id }) => {
  const index = selectedIds.value.indexOf(id);
  if (index > -1) {
    selectedIds.value.splice(index, 1);
  } else {
    selectedIds.value.push(id);
  }
};

const checkChange = async(newCheckedValues) => {
  const added = newCheckedValues.filter(value => !previousCheckedValues.value.includes(value));
  const removed = previousCheckedValues.value.filter(value => !newCheckedValues.includes(value));
  
  if (added.length > 0) {
    try {
      const res = await http.post('/api/add_my_work', {'code': userStore.userInfo.userCode, 'id': added[0].split('Φ')[0],'wpid': added[0].split('Φ')[1] });
    }
    catch (error) {
      console.error('Error:', error);
    }finally{
      load()
    }
    console.log('选中了:', added);
  }

  if (removed.length > 0) {
    const res = await http.post('/api/del_my_work', {'code': userStore.userInfo.userCode, 'id': removed[0].split('Φ')[0],'wpid': removed[0].split('Φ')[1] });
    load()
    console.log('取消选中:', removed);
  }

  previousCheckedValues.value = [...newCheckedValues];
  totalCheckedPrice.value = list.value
    .filter(item => newCheckedValues.includes(item.id + 'Φ' + item.wpid))
    .reduce((total, item) => total + (item.baseprice || 0), 0);

  totalConfirmedPrice.value = list.value
    .filter(item => newCheckedValues.includes(item.id + 'Φ' + item.wpid) && item.state === 1)
    .reduce((total, item) => total + (item.baseprice || 0), 0);
};

const formatDate = (date) => {
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
};

const onConfirm = (value) => {
  show.value = false;
  date.value = formatDate(value);
  console.log('选中日期:', date.value, todayDate );
  load()
};

const load = async () => {
  const res = await http.post('/api/get_my_wp_list', { userCode: userStore.userInfo.userCode, qdate: date.value });
  console.log('初次加载： ',res.data)
  list.value = res.data
  if (res.data){
    const defaultChecked = res.data.filter(item => item.dianlanstate === 1).map(item => item.id+'Φ'+item.wpid);
    checked.value = defaultChecked;
    previousCheckedValues.value = defaultChecked;
  }
}

onMounted(() => {
  load()
  console.log("首页加载啦; ", userStore.userInfo);
});
</script>

<style scoped>
.container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.checkbox {
  margin-bottom: 10px;
  padding: 10px 15px;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  line-height: 2;
  font-size: 0.8rem;
}

.price-display {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 0.35rem;
  line-height: 1.2;
}

.price-line {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.price-line span:first-child {
  font-weight: bold;
  margin-right: 5px;
}

.empty-tip {
  padding: 20px;
  text-align: center;
  color: #969799;
}

/* 多层 Tab 样式 */
.van-tabs__wrap {
  height: auto !important;
}

.van-tab {
  padding: 10px 5px;
}

.van-tab--active {
  font-weight: bold;
}
</style>