<template>
  <van-nav-bar
    title="人员产值统计"
    left-text="返回"
    left-arrow
    @click-left="onClickLeft"
  />
  <div>
    <!-- 日期选择器 -->
    <van-field
      v-model="selectedDate"
      is-link
      readonly
      label="选择日期"
      placeholder="请选择日期"
      @click="showDatePicker = true"
    />
    <van-calendar
      :min-date="minDate"
      :max-date="maxDate"
      v-model:show="showDatePicker"
      @confirm="onDateConfirm"
    />

    <!-- 折叠面板 -->
    <van-collapse v-model="activeNames" class="tree-list">
      <van-collapse-item
        v-for="owner in treeData"
        :key="owner.wpowner"
        :title="`${owner.wpownername} (总计：${owner.totalCount} 个，产值：${owner.totalPrice.toFixed(2)} 元)`"
        :name="owner.wpowner"
        class="tree-node"
      >
        <!-- 第二层：使用 van-cell 代替 van-collapse-item -->
        <van-cell
          v-for="user in owner.children"
          :key="user.fin_user"
          :title="`${user.fin_user_name} (已审核：${user.confirmedCount} 个，未审核：${user.unconfirmedCount} 个，产值：${user.totalPrice.toFixed(2)} 元)`"
          class="tree-node-sub"
        />
      </van-collapse-item>
    </van-collapse>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import http from '@/api/request';

// 状态
const minDate = ref(new Date(2000, 0, 1)); // 设置最小日期为2000年1月1日
const maxDate = ref(new Date(2100, 11, 31));
const todayDate = new Date().toLocaleDateString('en-CA').replace(/-/g, '/');
const selectedDate = ref(todayDate);
const showDatePicker = ref(false);
const activeNames = ref([]);
const rawData = ref([]); // 存储从接口获取的原始数据
const treeData = ref([]); // 树形结构数据
const onClickLeft = () => history.back();
// 获取数据
const fetchData = async () => {
  try {
    const res = await http.post('/api/get_peo_ana', { qdate: selectedDate.value });
    rawData.value = res.data; // 假设接口返回的数据在 res.data 中
    console.log('获取到的数据:', rawData.value); // 调试用，查看数据是否正确
    buildTreeData(); // 构建树形数据
  } catch (error) {
    console.error('获取数据失败:', error);
  }
};

// 去重函数：根据 wpid、dianlanid 和 fin_user 去重
const uniqueData = (data) => {
  const uniqueMap = new Map();
  data.forEach(item => {
    const key = `${item.wpid}-${item.dianlanid}-${item.fin_user}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item);
    }
  });
  return Array.from(uniqueMap.values());
};

// 构建树形数据
const buildTreeData = () => {
  if (!rawData.value.length) {
    treeData.value = [];
    return;
  }

  // 去重后的数据
  const uniqueRecords = uniqueData(rawData.value);
  console.log('去重后的数据:', uniqueRecords); // 调试用

  const owners = {};

  uniqueRecords.forEach(item => {
    if (!owners[item.wpowner]) {
      owners[item.wpowner] = {
        wpowner: item.wpowner,
        wpownername: item.wpownername,
        totalCount: 0,
        totalPrice: 0,
        children: {},
        activeNames: [],
      };
    }

    const owner = owners[item.wpowner];
    owner.totalCount += 1;
    owner.totalPrice += item.price;

    if (!owner.children[item.fin_user]) {
      owner.children[item.fin_user] = {
        fin_user: item.fin_user,
        fin_user_name: item.fin_user_name,
        confirmedCount: 0,
        unconfirmedCount: 0,
        totalPrice: 0,
      };
    }

    const user = owner.children[item.fin_user];
    if (item.state === 2) {  // 修改为根据state判断
      user.confirmedCount += 1;
    } else {
      user.unconfirmedCount += 1;
    }
    user.totalPrice += item.price;
  });

  console.log('构建的树形数据:', owners); // 调试用

  treeData.value = Object.values(owners).map(owner => ({
    ...owner,
    children: Object.values(owner.children),
  }));
};

// 在组件挂载时获取数据
onMounted(() => {
  fetchData();
});

// 监听 selectedDate 变化，重新获取数据
watch(selectedDate, () => {
  fetchData();
});

// 格式化日期
const formatDate = (date) => {
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
};

// 日期选择确认事件
const onDateConfirm = (date) => {
  selectedDate.value = formatDate(date);
  showDatePicker.value = false;
  console.log('选中日期:', selectedDate.value);
};
</script>

<style scoped>
.tree-list {
  margin-top: 20px;
}

.tree-node {
  margin-bottom: 10px;
}

.tree-node-sub {
  margin-left: 20px;
}
</style>