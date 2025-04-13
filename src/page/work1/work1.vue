<template>
  <van-nav-bar
      title="派工"
      left-text="返回"
      left-arrow
      @click-left="onClickLeft"
    />
    <van-popup v-model:show="showTop" position="top" round :style="{ height: '50%' }" @click-overlay="handlePopupClose">
      <van-search
        v-model="search_word"
        :placeholder="`搜索${ sw || ''}`"
        input-align="center"
        autofocus
        clearable
        @search="search"
        @clear="handleClear"
      />
      
      <!-- <lazy-component>
        <van-cell-group>
          <van-cell
            v-for="item in list"
            :key="item.key"
            :title="item.title"
            @click="select(item)"
          />
        </van-cell-group>
      </lazy-component> -->
      <RecycleScroller
      v-if="list.length > 0"
      class="scroller"
      :items="list"
      :item-size="50"
      :page-mode="true"
      :buffer="2000"
      :prerender="100"
      key-field="id"
    >
    <template #default="{ item }">
        <template v-if="sw === '电缆代号'">
          <van-checkbox-group v-model="selectedDaihao">
            <van-cell>
              <van-checkbox :name="item.value">{{ item.title }}</van-checkbox>
            </van-cell>
          </van-checkbox-group>
        </template>
        <template v-if="sw === '设备地点'">
          <van-checkbox-group v-model="selectedFacilitiesLoca">
            <van-cell>
              <van-checkbox :name="item.value">{{ item.title }}</van-checkbox>
            </van-cell>
          </van-checkbox-group>
        </template>
        <template v-else>
          <van-cell :title="item.title" @click="select(item)" />
        </template>
      </template>
    </RecycleScroller>
    <div v-if="sw === '电缆代号' || sw === '设备地点'" class="select-all-container">
        <van-row gutter="10">
        <van-col span="12">
          <van-button block type="primary" @click="handleSelectAll(true)">全选</van-button>
        </van-col>
        <van-col span="12">
          <van-button block type="default" @click="handleSelectAll(false)">取消全选</van-button>
        </van-col>
      </van-row>
      </div>
    </van-popup>
    <van-popup>
      <van-search />
    </van-popup>
    <!-- 派工单人员选择 -->
    <van-popup
    v-model:show="wp_user_picker"
    destroy-on-close
    round
    :style="{ height: '80%' }"
    position="bottom"
    @click-overlay="wp_user_picker = false"
  >
    <!-- 搜索框 -->
    <div style="position: sticky; top: 1px; z-index: 100; display: flex; align-items: center; gap: 1px;">
      <van-search
        v-model="searchQuery"
        placeholder="搜索用户"
        @search="filterUsersChange"
        style="flex: 4;"
      />
      <van-button
        type="primary"
        size="small"
        @click="confirmSubWp"
        style="flex: 1; max-width: 120px; margin-right: 0.5rem"
      >
        提交工单
      </van-button>
    </div>
    <div style="display: flex; height: calc(100% - 50px);">
      <!-- 左侧列表 -->
      <div style="flex: 1; padding: 10px; border-right: 1px solid #eee;">
        <p style="font-size: 0.3rem;">可选用户</p>
        <lazy-component>
          <van-cell-group>
            <van-cell
              v-for="item in filteredLeftList"
              :key="item.id"
              :title="item.username"
              @click="moveToRight(item)"
            >
            <template #title>
              <span v-html="item.username"></span>
            </template>
            </van-cell>
          </van-cell-group>
        </lazy-component>
      </div>
      
      <!-- 右侧列表 -->
      <div style="flex: 1; padding: 10px;">
        <p style="font-size: 0.3rem;">已选用户</p>
        <van-list>
          <van-cell-group>
            <van-cell
              v-for="item in rightList"
              :key="item.id"
              :title="item.username"
              @click="moveToLeft(item)"
            />
          </van-cell-group>
        </van-list>
      </div>
    </div>
  </van-popup>
    <!-- 拉线区域选择 -->
    <van-popup v-model:show="showPicker" destroy-on-close round position="bottom" @click-overlay="showPicker = false,cart_laxian=false,console.log(cart_laxian)">
      <van-picker
        :model-value="pickerValue"
        :columns="columns"
        @cancel="showPicker = false,cart_laxian=false,console.log(cart_laxian)"
        
        @confirm="onConfirm"
      />
      
    </van-popup>
    <van-popup v-model:show="showCartPopup" destroy-on-close round position="bottom" :style="{ height: '80%' }">
      
        <van-button type="primary"  @click="rmCart" size="large">
          移除全部
          </van-button> 
          <div class="cart-container" :style="{ height: scrollerHeight }">
            <RecycleScroller
              v-if="cart.length > 0"
              class="cart-scroller"
              :items="cart"
              :item-size="120" 
              key-field="id" 
              :page-mode="false"
              :key="'scroller-'+cart.length"
            >
    <template #default="{ item, index }">
      <!-- 保持原有van-swipe-cell和van-card结构 -->
      <van-swipe-cell>
        <van-card
          :num="item.num"
          :price="parseFloat(item.baseprice + item.fa_price).toFixed(2)"
          :desc="item.model+'  '+ item.specification"
          :tag="item.proj.substr(-4)"
          :title="item.daihao"
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
    </template>
  </RecycleScroller>
</div>
  <!-- 保持空状态显示 -->
  <div v-if="cart.length === 0" style="text-align: center; padding: 20px;">
    已选为空
  </div>
      
    </van-popup>
    
    <van-collapse v-model="activeNames">
  <van-collapse-item title="搜索条件" name="1">
    <van-cell-group 
      style="z-index: 10; position: sticky; top: 0; background-color: #fff; display: grid;">
      <van-cell
        v-for="(item, index) in gridItems"
        :key="index"
        :title="item.key"
        :value="item.text"
        clickable
        :required="item.key === '船号' || item.key === '设备地点'"
        :title-style="{
            fontWeight: 'bold',
          }"
        :style="{
          '--van-cell-text-color': selected[index] ? '#000' : '#ccc',
          '--van-cell-value-color': selected[index] ? '#000' : '#ccc',
        }"
        @click="handleGridClick(index)"
        style="border-bottom: 1px solid #f5f5f5; border-right: 1px solid #f5f5f5; border-left: 1px solid #f5f5f5;"
      />
    </van-cell-group>
  </van-collapse-item>
</van-collapse>
    
<div class="card-container">
  <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
    <!-- <van-list
      v-model:loading="loading"
      :finished="finished"
      finished-text="没有更多了"
      @load="onLoad"
    > -->
    <RecycleScroller
      v-if="show_list.length > 0"
      class="scroller"
      :items="show_list"
      :item-size="180" 
      :page-mode="true"
      :buffer="1000"
      :prerender="10"
      key-field="id"
      @load="onLoad" 
    >
    <template #default="{ item }">
    <van-card
        :num="item.num"
        :price="item.fa_price ? item.baseprice + ' + ' + (parseFloat(item.fa_price).toFixed(2)): item.baseprice"
        :desc="item.model+'  '+ item.specification"
        :title="item.daihao"
        style="--van-card-font-size: 0.4rem;"
        >
        <template #tags>
          <van-tag v-if="item.proj"  type="primary" style="margin-right: 0.1rem;">{{ item.proj }}</van-tag>
            <van-tag v-if="item.facilities && item.facilities.trim() !== ''" plain type="primary" style="margin-right: 0.1rem;">{{ item.facilities }}</van-tag>
            <van-tag v-if="item.facilities_loca && item.facilities_loca.trim() !== ''"  color="#5a73a4"  style="margin-right: 0.1rem;">{{ item.facilities_loca }}</van-tag>
            <van-tag v-if="item.facilities_name && item.facilities_name.trim() !== ''" plain color="#5a73a4" style="margin-right: 0.1rem;">{{ item.facilities_name }}</van-tag>
            
            <van-tag v-if="item.last_fangxian_loca_name && item.last_fangxian_loca_name.trim() !== ''"   color="#8d3f20" >{{ "放线区域："+item.last_fangxian_loca_name }}</van-tag>
            <van-tag v-if="item.fangxianren && item.fangxianren.trim() !== ''" plain  color="#8d3f20" style="margin-right: 0.1rem;">{{ " 放线:"+item.fangxianren}}</van-tag>
            <van-tag v-if="item.fin_user && item.fin_user.trim() !== ''"  type="warning" style="margin-right: 0.1rem;">{{ "接线："+item.fin_user }}</van-tag>
          </template>
        <template #footer>
            <van-button
              v-if="[0, 3, 4, 5].includes(userStore.userInfo.userRole) && item.fangxianren != null"
              :disabled = "true"
              :color="(item.last_fangxian )?'#dd9e21' : ''"
              size="small"
              @click="laxian(item)"
            >{{ item.fangxianren || '完成拉线' }}</van-button>
            <van-button 
              size="small" 
              :color="(item.fin_user )?'#ffc107' : ''"
              :disabled="((item.paip != null && item.fin_user != null) || item.last_fangxian== null)" 
              @click="addCart(item)">
              {{ item.paip || '选中' }}
          </van-button>
          <!-- :disabled="item.last_fangxian != null || (item.paip != null && item.fin_user != null)"  -->
        </template>
        </van-card> 
      </template>
      <template #after>
        <div v-if="loading" class="loading-text">加载中...</div>
        <div v-if="finished" class="finished-text">没有更多了</div>
      </template>
    </RecycleScroller>
    <div v-if="show_list.length === 0 && !loading" class="empty-state">
      暂无数据
    </div>
  </van-pull-refresh>
</div>  



    <van-submit-bar :price="totalPrice" button-text="提交派工单">
      <template #button>
        <!-- <van-action-bar-button type="warning" text="提交拉线" @click="onSubmit_laxian" style="border-radius: 0.5rem; border-bottom-left-radius: 0.5rem;"/> -->
        <van-action-bar-button type="danger" :disabled ="dis_sub" text="提交派工单" @click="onSubmit" style=" border-radius: 0.5rem;  border-bottom-right-radius: 0.5rem;"/>
      </template>  
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
        
    </van-submit-bar>
  </template>
  
  <script setup>
  import { ref, onMounted, watch, computed } from 'vue';
  import { showToast } from 'vant'
  import Pinyin from 'pinyin-match';
  import http from '@/api/request';
  import { showConfirmDialog  } from 'vant';
  import { useUserStore } from '@/store/userStore';
  import { v4 as uuidv4 } from 'uuid';
  import { RecycleScroller } from 'vue-virtual-scroller';
  import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
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
  const leftList = ref([])
  const wp_user_picker = ref(false)
  const columns = ref([
      { text: '', value: '' },
  ])
  const filteredLeftList = ref([]);
  const selectedDaihao = ref([]);
  const selectedFacilitiesLoca = ref([]);
  const rightList = ref([]);
  const fieldValue = ref('');
  const showPicker = ref(false);
  const showCartPopup = ref(false);
  const pickerValue = ref([]);
  const searchQuery = ref([]);
  let lastRequestTime = 0;
  const throttleDelay = 1000; 
  const activeNames = ref(['1']);
  const syn_loca = ref(true)
  const dis_sub = computed(() => {
  // 如果 cart 为空，或者有任意一个 last_fangxian 为空，则禁用按钮
  return cart.value.length === 0 || cart.value.some(item => !item.last_fangxian || item.last_fangxian.trim() === '');
});
  // Grid 项数据
  const gridItems = ref([
    // { text: '公司', key: '公司' },
    { text: '船号', key: '船号' },
    { text: '区域', key: '区域' },
    { text: '设备地点', key: '设备地点' },
    { text: '设备', key: '设备' },
    { text: '电缆规格', key: '电缆规格' },
    { text: '电缆型号', key: '电缆型号' },
    { text: '电缆代号', key: '电缆代号' },
    
    
    // { text: '总线长', key: '总线长' },
    // { text: '系统名', key: '系统名' },
  ]);

  const scrollerHeight = computed(() => {
    return 'calc(100vh - 250px)'; // 根据你的实际布局调整
  });

  const onClickLeft = () => history.back();

  const handleSelectAll=(selectAll) => {
    if (!Array.isArray(list.value)) return;
    if (sw.value === '电缆代号') {
      // selectedDaihao.value = list.value.map(item => item.value);
      selectedDaihao.value = selectAll ? list.value.map(item => item.value) : [];
    } else if (sw.value === '设备地点') {
      // selectedFacilitiesLoca.value = list.value.map(item => item.value);
      selectedFacilitiesLoca.value = selectAll ? list.value.map(item => item.value) : [];
    }
  };

  const rmCart = () => {
    cart.value = [];
    totalPrice.value = 0.00;
    showCartPopup.value = false;
  };
  const handleClear = () => {
  // 如果是电缆代号，清空复选框选中
  if (sw.value === '电缆代号') {
    selectedDaihao.value = [] // 清空复选框选中值
    searchWords.value['电缆代号'] = [] // 清空搜索参数
  }
  if (sw.value === '设备地点') {
    selectedFacilitiesLoca.value = [] // 清空复选框选中值
    searchWords.value['设备地点'] = [] // 清空搜索参数
  }
  // 执行原有search逻辑
  search()
}
  

  const filterUsers = ref('');

  const confirmSubWp = async() => {
    
    console.log('confirmSubWp:', rightList.value);
    console.log('confirmSubWp:', cart.value);
    const res = await http.post('/api/add_wp', {
      ope: userStore.userInfo.userCode,
      dianlan: cart.value.map(item => item.id),
      user: rightList.value.map(item => item.usercode),
    });
    console.log(res.data)
    if (res.code === 0) {
      showToast('派工成功');
      // 清空cart
      
    
      // 更新 cart 中的 last_fangxian 字段
      // show_list.value.forEach(item => item.last_fangxian = userStore.userInfo.userCode);
      // 更新 show_list 中的paip 字段
      show_list.value.forEach((item) => {
      if (cart.value.map(item => item.id).includes(item.id)) {
        item.paip = userStore.userInfo.userName;
      }
    });
      cart.value = [];
      totalPrice.value = 0.00;
      // 更新目标项的信息
      wp_user_picker.value = false;
    } else {
      // 处理失败的情况（例如可以显示错误提示）
      showToast(res.message || '派工失败，请重试');
    }
  };

  const filterUsersChange = async(value) => {
    console.log('filterUsersChange:', value);
    if (value === '') {
      filteredLeftList.value = leftList.value;
      return;
    }
    // filteredLeftList rightList leftList
    const matches = [];
    leftList.value.forEach(item => {
      let metchRes = Pinyin.match(item.username, value);
      console.log(item)
      if(metchRes)
        matches.push(item)
    });
    filteredLeftList.value = matches;
    
  };

  const moveToRight = (item) => {
    rightList.value.push(item);
    filteredLeftList.value = filteredLeftList.value.filter(leftItem => leftItem.id !== item.id); 
    leftList.value = leftList.value.filter(leftItem => leftItem.id!== item.id);
  };

  const moveToLeft = (item) => {
    filteredLeftList.value.push(item);
    leftList.value.push(item);
    rightList.value = rightList.value.filter(rightItem => rightItem.id!== item.id);
  };

  const onConfirm = async({ selectedValues, selectedOptions }) => {
    console.log('selectedValues:', selectedValues,selectedOptions,cart_laxian.value);
    if (cart_laxian.value){
      // 判断cart中所有元素的 last_fangxian_loca 是否有和 selectedValues[1] 不一样的
      // const hasDifferentLoca = cart.value.some(item => item.last_fangxian_loca !== selectedValues[1]);
      const hasDifferentLoca = cart.value.some(item => item.last_fangxian_loca && item.last_fangxian_loca !== selectedValues[1]);
      console.log('hasDifferentLoca:', hasDifferentLoca);
      if (hasDifferentLoca) {
        // 如果存在不一样的，弹出确认对话框
        showConfirmDialog({
          title: '标题',
          message: '存在已放线区域和所选区域不一致，是否覆盖。',
          confirmButtonText: '覆盖',  // 修改确认按钮文本
          cancelButtonText: '不覆盖',

        })
          .then(async () => {
            // on confirm 的时候，执行原逻辑
            const res = await http.post('/api/batch_laxian', {
              ope: userStore.userInfo.userCode,
              locaitem: selectedValues[1],
              xian_ids: cart.value.map(item => item.id),
              proj: searchWords.value['船号']
            });

            console.log(res.data);
            if (res.data.every(result => result.affectedRows > 0)) {
              showToast('拉线成功');
              // 更新目标项的信息
              cart.value.forEach(cartItemId => {
                console.log('cartItemId:', cartItemId.id);
                const targetItem = show_list.value.find(item => item.id === cartItemId.id);
                if (targetItem) {
                  targetItem.fangxianren = userStore.userInfo.userName; // 更新放线人
                  targetItem.last_fangxian = userStore.userInfo.userCode; // 更新最后放线人
                }
              });
              cart_laxian.value = false;
              console.log('更新后的 show_list1:', show_list.value);
            } else {
              showToast('部分或全部更新失败，请检查');
            }
          })
          .catch(() => {
            // on cancel 的时候，跳过那些已经放线的id（last_fangxian_loca不为空的）
            const skippedIds = cart.value.filter(item => item.last_fangxian_loca !== null).map(item => item.id);
            const remainingIds = cart.value.filter(item => item.last_fangxian_loca === null).map(item => item.id);

            // 只提交没有放线过的 xian_ids
            if (remainingIds.length > 0) {
              http.post('/api/batch_laxian', {
                ope: userStore.userInfo.userCode,
                locaitem: selectedValues[1],
                xian_ids: remainingIds,
                proj: searchWords.value['船号']
              }).then((res) => {
                console.log(res.data);
                if (res.data.every(result => result.affectedRows > 0)) {
                  showToast('拉线成功');
                  // 更新目标项的信息
                  remainingIds.forEach(id => {
                    const targetItem = show_list.value.find(item => item.id === id);
                    if (targetItem) {
                      targetItem.fangxianren = userStore.userInfo.userName; // 更新放线人
                      targetItem.last_fangxian = userStore.userInfo.userCode; // 更新最后放线人
                    }
                  });
                } else {
                  showToast('部分或全部更新失败，请检查');
                }
              });
            }
          });
      } else {
        // 如果没有不一样的 last_fangxian_loca，直接执行原逻辑
        const res = await http.post('/api/batch_laxian', {
          ope: userStore.userInfo.userCode,
          locaitem: selectedValues[1],
          xian_ids: cart.value.map(item => item.id),
          proj: searchWords.value['船号']
        });

        console.log(res.data);
        if (res.data.every(result => result.affectedRows > 0)) {
          showToast('拉线成功');
          // 更新目标项的信息
          cart.value.forEach(cartItemId => {
            console.log('cartItemId:', cartItemId.id);
            const targetItem = show_list.value.find(item => item.id === cartItemId.id);
            if (targetItem) {
              targetItem.fangxianren = userStore.userInfo.userName; // 更新放线人
              targetItem.last_fangxian = userStore.userInfo.userCode; // 更新最后放线人
            }
          });
          cart_laxian.value = false;
          console.log('更新后的 show_list1:', show_list.value);
        } else {
          showToast('部分或全部更新失败，请检查');
        }
      }
    }else{
      console.log('哪根线？ ',clickItem.value.id)
      const res = await http.post('/api/laxian', {
        ope: userStore.userInfo.userCode,
        locaitem: selectedValues[1],
        xian_id: clickItem.value.id,
        proj: searchWords.value['船号']
      });
      if (res.data[0].affectedRows > 0 || res.data[1].affectedRows > 0) {
        showToast('拉线成功')
        const targetItem = show_list.value.find(item => item.id === clickItem.value.id);
        if (targetItem) {
          targetItem.fangxianren = userStore.userInfo.userName; // 更新放线人
          targetItem.last_fangxian = userStore.userInfo.userCode; // 更新最后放线人
          targetItem.last_fangxian_loca = selectedValues[1];
        }
        console.log('更新后的 show_list2:', show_list.value);
      }
      
    }
    showPicker.value = false;
    pickerValue.value = selectedValues; //picker 绑定的值
    fieldValue.value = selectedOptions[1].text;
  };

  const delCart = (index) => {
    const newCart = [...cart.value];
    newCart.splice(index, 1);
    cart.value = newCart;
    
    totalPrice.value = newCart.reduce((total, item) => total + item.baseprice*100, 0);
  };

  const addAll2Cart = () => {
    console.log('尝试添加所有到车：', show_list.value);

    // 筛选出未在购物车中的商品
    const newItems = show_list.value.filter(item => 
      (!cart.value.some(cartItem => cartItem.id === item.id)) && 
      item.last_fangxian &&
      (item.fin_user === null || item.fin_user === '') 
      
    );

    if (newItems.length === 0) {
      // 如果所有商品都已存在，显示提示
      showToast('所有都已经加入');
    } else {
      // 将未在购物车中的商品加入购物车
      cart.value.push(...newItems);
      totalPrice.value += newItems.reduce((total, item) => total + item.baseprice*100 + item.fa_price*100, 0);
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
      totalPrice.value += item.baseprice*100+item.fa_price*100;
      // 触发放大缩小动画
      isScaling.value = true;

      // 在动画完成后移除类名
      setTimeout(() => {
        isScaling.value = false;
      }, 300); // 与 CSS 动画时间一致
    }
  };
  const cart_laxian = ref(false)
  // 
  const onSubmit_laxian = async() => {
    console.log('提交拉线工单：', cart.value);
    const tmp_ori_fangxian_loca = Object.entries(
    cart.value.reduce((map, { last_fangxian_loca }) => {
        // 过滤掉 last_fangxian_loca 为 null 的情况
        if (last_fangxian_loca !== null) {
            map[last_fangxian_loca] = (map[last_fangxian_loca] || 0) + 1;
        }
        return map;
    }, {})
).reduce((acc, [loca, count]) => 
    count > acc[1] ? [loca, count] : count === acc[1] ? [[...acc[0], loca], count] : acc
, [[], 0])[0];
console.log(tmp_ori_fangxian_loca);
    const res = await http.post('/api/search_loca', {
        ope: userStore.userInfo.userCode,
        proj: searchWords.value['船号']
      });
      console.log('拉线： ', res.data);
      console.log('car-tree:', convertToTree1(res.data, tmp_ori_fangxian_loca));
      const { tree, defaultPickerValue } = convertToTree1(res.data, tmp_ori_fangxian_loca);
      columns.value = tree;
      pickerValue.value = defaultPickerValue || []; //picker 绑定的值
      cart_laxian.value = true;
      showPicker.value = true;
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
          const res = await http.post('/api/cancel_laxian', {
            ope: userStore.userInfo.userCode,
            locaitem: null,
            xian_id: item.id
          })
          if (res.data[0].affectedRows > 0 || res.data[1].affectedRows > 0) {
            showToast('取消拉线成功！')
            const targetItem = show_list.value.find(item1 => item1.id === item.id);
            if (targetItem) {
              targetItem.fangxianren = null; // 更新放线人
              targetItem.last_fangxian = null; // 更新最后放线人
              targetItem.last_fangxian_loca = null;
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
      const res = await http.post('/api/search_loca', {
        ope: userStore.userInfo.userCode,
        proj: searchWords.value['船号']
      });
      console.log('拉线： ', res.data);
      console.log(convertToTree1(res.data, item.ori_fangxian_loca));
      const { tree, defaultPickerValue } = convertToTree1(res.data, item.ori_fangxian_loca);
      columns.value = tree;
      pickerValue.value = defaultPickerValue || []; //picker 绑定的值
      showPicker.value = true;
    }
   
  };

  // 转换成树
  const convertToTree=(data)=> {
    const tree = [];
    const tempDict = {};

    data.forEach(({ id, locaname, state, itemid, itemname }) => {
        if (!tempDict[id]) {
            // 添加新的父节点
            const parentNode = {
                text: locaname,
                value: String(id),
                children: []
            };
            tree.push(parentNode);
            tempDict[id] = parentNode;
        }

        // 添加子节点
        tempDict[id].children.push({
            text: itemname,
            value: String(itemid)
        });
    });

    return tree;
}
//  转换成树-1
const convertToTree1 = (data, ori_fangxian_loca) => {
  // console.log('ori_fangxian_loca:', ori_fangxian_loca);
    const tree = [];
    const tempDict = {};
    let defaultPickerValue = null;
    data.forEach(({ id, locaname, state, itemid, itemname }) => {
      // const selected = ori_fangxian_loca && String(ori_fangxian_loca) === String(itemid);
      // console.log(`itemid: ${itemid}, ori_fangxian_loca: ${ori_fangxian_loca}, selected: ${selected}`);
        if (!tempDict[id]) {
            // 添加新的父节点
            const parentNode = {
                text: locaname,
                value: String(id),
                children: []
            };
            tree.push(parentNode);
            tempDict[id] = parentNode;
        }

        // 添加子节点
        const childNode = {
            text: itemname,
            value: String(itemid),
            // 这里设置选中状态
            selected: ori_fangxian_loca && String(ori_fangxian_loca) === String(itemid)
        };
        if (ori_fangxian_loca && String(ori_fangxian_loca) === String(itemid)) {
            defaultPickerValue = [String(id), String(itemid)]; // 设置默认值
        }

        tempDict[id].children.push(childNode);
    });

    return {tree,defaultPickerValue };
};
  
  // 选中的状态
  const selected = ref(Array(gridItems.value.length).fill(false));
  const searchWords = ref({
    '公司': '',
    '船号': '',
    '电缆代号': '',
    '电缆型号': '',
    '电缆规格': '',
    '设备': '',
    '设备地点': '',
    '区域': '',
    '区域名称': '',
    '总线长':'',
    '系统名':''
  }); // 存储每个 grid 的搜索词
  
  const onSubmit = () => {
    console.log("cart:" ,cart.value)
    if (cart.value.length === 0) {
      showToast('请选择要派工的线缆');
      return; 
    }
    // 生成工单 workpack
    wp_user_picker.value = true;
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
        // console.log('返回电缆值-1：',show_list.value.length,responseData.totalCount)
        if (show_list.value.length >= responseData.totalCount) {
          
          finished.value = true;
          // console.log('返回电缆值-2：',finished.value)
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
    if (searchWords.value['船号'].length == 0) {
      console.log('请输入船号');
      return 
    }
    const now = Date.now();
    if (now - lastRequestTime < throttleDelay) {
      // loading.value = false;
      showToast('请求过于频繁，请稍后再试。');
      return null; // 如果在节流时间内，不执行函数
    }
    lastRequestTime = now;
    // 在 fetchData 中构造 sd 数据
    const url = '/api/search_dl';
    const data = {
      company: searchWords.value['公司'],
      proj: searchWords.value['船号'],
      daihao: selectedDaihao.value,
      model: searchWords.value['电缆型号'],
      spec: searchWords.value['电缆规格'],
      facilities: searchWords.value['设备'],
      // facilities_loca: searchWords.value['设备地点'],
      facilities_loca: selectedFacilitiesLoca.value,
      loca_item: searchWords.value['区域'],
      total_length: searchWords.value['总线长'],
      sysname: searchWords.value['系统名'],
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
  const select = async (item) => {
    console.log('Selected:', item.title);
    const index = gridItems.value.findIndex((item) => item.key === sw.value);
    console.log('index: ',index);   
    if (index !== -1) {
      gridItems.value[index].text = item.title; // 更新 grid 文本
      selected.value[index] = true; // 标记为选中
    }
    try {
      
      list.value = [];
      searchWords.value[sw.value] = item.value; // 保存搜索词
      if (sw.value === '区域') {
        searchWords.value['区域名称'] = item.title; // 保存区域的名称
      }
      console.log('select------searchWords.value: ',searchWords.value);
      page.value = 0;
      const responseData = await fetchData();
      console.log('返回电缆值-select：', responseData.totalCount,responseData.data);
      show_list.value = responseData.data;
      showTop.value = false; 
    } catch (error) {
      console.error('处理请求时出错:', error);
    }
  };


const handlePopupClose = () => {

list.value = [];
if (sw.value === '电缆代号') {
// 处理复选框选中值
if (selectedDaihao.value.length > 0) {
  // 将选中值存入 searchWords
  searchWords.value[sw.value] = selectedDaihao.value;

// 更新grid显示
const index = gridItems.value.findIndex(item => item.key === sw.value);
if (index !== -1) {
  gridItems.value[index].text = selectedDaihao.value.length > 0 
    ? `已选 ${selectedDaihao.value.length} 项`
    : '电缆代号';
  selected.value[index] = selectedDaihao.value.length > 0;
}

// 触发数据刷新
refreshing.value = true;
onLoad();
} else if (search_word.value.length === 0) {
  // 未输入且未选择时恢复默认
  const index = gridItems.value.findIndex(item => item.key === sw.value);
  if (index !== -1) {
    gridItems.value[index].text = '电缆代号';
    selected.value[index] = false;
    searchWords.value[sw.value] = '';
  }
}
} else if (sw.value === '设备地点') {
    // 处理复选框选中值
    if (selectedFacilitiesLoca.value.length > 0) {
      // 将选中值存入 searchWords
      searchWords.value[sw.value] = selectedFacilitiesLoca.value;
    
    // 更新grid显示
    const index = gridItems.value.findIndex(item => item.key === sw.value);
    if (index !== -1) {
      gridItems.value[index].text = selectedFacilitiesLoca.value.length > 0 
        ? `已选 ${selectedFacilitiesLoca.value.length} 项`
        : '电缆代号';
      selected.value[index] = selectedFacilitiesLoca.value.length > 0;
    }
    
    // 触发数据刷新
    refreshing.value = true;
    onLoad();
    } else if (search_word.value.length === 0) {
      // 未输入且未选择时恢复默认
      const index = gridItems.value.findIndex(item => item.key === sw.value);
      if (index !== -1) {
        gridItems.value[index].text = '电缆代号';
        selected.value[index] = false;
        searchWords.value[sw.value] = '';
      }
    }
  }else {
if (search_word.value.length == 0) {
  const currentKey = gridItems.value.find((item) => item.key === sw.value)?.key;
  console.log('搜索框关闭时候index: ',currentKey);
  if (currentKey) {
    searchWords.value[currentKey] = search_word.value;
    const index = gridItems.value.findIndex((item) => item.key === currentKey);
    if (index !== -1) {
        refreshing.value = true;
        onLoad();
        // gridItems.value[index].text = currentKey; // 恢复默认的 key 作为 text
        if (currentKey === '区域') {
          gridItems.value[index].text = searchWords.value['区域名称'] || currentKey; // 恢复区域的名称
        } else {
          gridItems.value[index].text = currentKey; // 恢复默认的 key 作为 text
        }
        selected.value[index] = false; // 取消选中状态
    }
  }
}

}
// showTop.value = false;
};
  

const search = async () => {
    console.log('search',search_word.value,sw.value);
    search_word.value = search_word.value.toString().trim().toUpperCase(); // 去除首尾空格
    const sd = {
      'sw': sw.value,
      'company': sw.value=='公司'?search_word.value:searchWords.value['公司'],
      'proj': sw.value=='船号'?search_word.value:searchWords.value['船号'],
      'daihao': sw.value=='电缆代号'?search_word.value:selectedDaihao.value,
      'model': sw.value=='电缆型号'?search_word.value:searchWords.value['电缆型号'],
      'spec': sw.value=='电缆规格'?search_word.value:searchWords.value['电缆规格'],
      'facilities_name': sw.value=='设备'?search_word.value:searchWords.value['设备'],
      'facilities_loca': sw.value=='设备地点'?search_word.value:selectedFacilitiesLoca.value,
      'loca_item': sw.value=='区域'?search_word.value:searchWords.value['区域'],
      'total_length': sw.value=='总线长'?search_word.value:searchWords.value['总线长'],
      'sysname': sw.value=='系统名'?search_word.value:searchWords.value['系统名'],
    };
    var url = '/api/search_company';
   
    const response = await http.post(url, sd);
    console.log('返回值：',response.data)
    const tmp = [];
    for (let i = 0; i < response.data.length; i++) {
      const itemKey = uuidv4(); 
      if (sw.value=='公司'){
        tmp.push({ id: i, value:response.data[i]['company'],title: response.data[i]['company'] });
      }else if (sw.value=='船号'){
        tmp.push({ id: i, value:response.data[i]['proj'],title: response.data[i]['proj'] });
      }
      else if (sw.value=='电缆代号'){
        tmp.push({ id: i, value:response.data[i]['daihao'],title: response.data[i]['daihao'] });
      }else if (sw.value=='电缆型号'){
        tmp.push({ id: i, value:response.data[i]['model'],title: response.data[i]['model'] });
      }else if (sw.value=='电缆规格'){
        tmp.push({ id: i, value:response.data[i]['specification'],title: response.data[i]['specification'] });
      }else if (sw.value=='设备'){
        tmp.push({ id: i, value:response.data[i]['facilities_name'],title: response.data[i]['facilities_name'] });
      }else if (sw.value=='设备地点'){
        tmp.push({ id: i, value:response.data[i]['facilities_loca'],title: response.data[i]['facilities_loca'] });
      }else if (sw.value=='区域'){
        tmp.push({ id: i, value:response.data[i]['itemid'],title: response.data[i]['itemname'] });
      }
      else if (sw.value=='总线长'){
        tmp.push({ id: i, value:response.data[i]['total_length'],title: response.data[i]['total_length'] });
      }else if (sw.value=='系统名'){
        tmp.push({ id: i, value:response.data[i]['sysname'],title: response.data[i]['sysname'] });
      }
    }
    list.value = tmp.filter(item => item && item.id);
    console.log("看看list",list.value);
  };
  
  // 点击 Grid 事件
  const handleGridClick = async(index) => {
    
    const selectedItem = gridItems.value[index];

    sw.value = selectedItem.key; // 设置当前类型
    console.log('点击grid： ',sw.value);
    //if (!['船号'].includes(sw.value) && (searchWords.value['船号'] == '')) {
    //  showToast('请先选择船号');
    //  return;
    //}
    // 如果已经选中过，恢复之前的搜索词；否则清空搜索词
    search_word.value = searchWords.value[selectedItem.key] || '';
    console.log('search_word.value: ',searchWords.value);
    await search()
    showTop.value = true; // 显示搜索弹窗
  };

  // const loadSearchWords = async() => {
  //     const savedSearchWords = localStorage.getItem('searchWords');
      
  //     if (savedSearchWords) {
  //       searchWords.value = JSON.parse(savedSearchWords);
  //       gridItems.value = gridItems.value.map(item => {
  //         if (item.key === '区域') {
  //           return {
  //             ...item,
  //             text: searchWords.value['区域名称'] || item.text // 显示区域的名称
  //           };
  //         }
  //         return {
  //           ...item,
  //           text: searchWords.value[item.key] || item.text
  //         };
  //       });
  //       selected.value = gridItems.value.map(item => {
  //         return searchWords.value[item.key] ? true : false;
  //       });
  //       const responseData = await fetchData();
  //       console.log('返回电缆值-loadSearchWords：', responseData.totalCount,responseData.data);
  //       show_list.value = responseData.data;
  //       if (show_list.value.length >= responseData.totalCount) {
          
  //         finished.value = true;
  //         // console.log('返回电缆值-2：',finished.value)
  //       }

  //       console.log('parse---savedSearchWords: ',searchWords.value);
  //     }
  //   };

  const loadSearchWords = async () => {
  // 从 localStorage 读取保存的数据（包含 searchWords 和 selectedDaihao）
  const savedData = localStorage.getItem('searchData'); // 键名改为 searchData

  if (savedData) {
    try {
      const parsedData = JSON.parse(savedData);

      // 兼容旧版数据（如果之前只保存了 searchWords）
      const oldSearchWords = parsedData.searchWords || parsedData; // 兼容旧版
      const savedSelectedDaihao = parsedData.selectedDaihao || []; // 新增 selectedDaihao
      const savedSelectedFacilitiesLoca = parsedData.selectedFacilitiesLoca || [];
      // 恢复 searchWords
      searchWords.value = oldSearchWords;
      
      // 恢复 selectedDaihao
      selectedDaihao.value = savedSelectedDaihao;
      selectedFacilitiesLoca.value = savedSelectedFacilitiesLoca;
      // 更新 gridItems 的显示文本
      gridItems.value = gridItems.value.map(item => {
        if (item.key === '区域') {
          return {
            ...item,
            text: searchWords.value['区域名称'] || item.text
          };
        }
        return {
          ...item,
          text: searchWords.value[item.key] || item.text
        };
      });

      // 更新选中状态（selected 数组）
      selected.value = gridItems.value.map(item => {
        return searchWords.value[item.key] ? true : false;
      });

      // 获取最新数据
      const responseData = await fetchData();
      console.log('加载数据成功:', {
        totalCount: responseData.totalCount,
        data: responseData.data
      });

      // 更新列表
      show_list.value = responseData.data;
      finished.value = show_list.value.length >= responseData.totalCount;

    } catch (err) {
      console.error('加载本地数据失败:', err);
      // 如果解析失败，清空本地存储
      localStorage.removeItem('searchData');
    }
  }
};

  const loadAllUser = async() => {
      const url = '/api/get_all_user';
      const response = await http.get(url);
      console.log('返回值：',response.data)
      // all_user.value = response.data;
      filteredLeftList.value = response.data;
      leftList.value = response.data;
  };

  const saveSearchWords = () => {
    const dataToSave = {
      searchWords: searchWords.value,
      selectedDaihao: selectedDaihao.value, // 新增 selectedDaihao 的保存
      selectedFacilitiesLoca: selectedFacilitiesLoca.value
    };
    localStorage.setItem('searchWords', JSON.stringify(dataToSave));
    console.log('searchWords saved: ',dataToSave);
  };

  watch(
    [() => searchWords.value, () => selectedDaihao.value],
    () => {
      saveSearchWords();
    },
    { deep: true }
  );
  watch(
    [() => searchWords.value, () => selectedFacilitiesLoca.value],
    () => {
      saveSearchWords();
    },
    { deep: true }
  );

  onMounted( async() => {
    await loadSearchWords();
    await loadAllUser();
    console.log("首页加载啦; ",userStore.userInfo);
 
  })
  

  

  </script>
  
  <style scoped>
  /* 样式根据需要自定义 */
  .cart-container {
  /* 确保容器有明确的高度 */
  height: 100%;
  overflow: hidden;
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

  .select-all-container {
  position: sticky;
  bottom: 0;
  padding: 10px;
  background-color: white;
  border-top: 1px solid #eee;
}

/* 可选：调整按钮间距 */
.van-row {
  margin: -5px; /* 抵消 gutter 的外边距 */
}
.van-col {
  padding: 0 5px; /* 调整列间距 */
}

.cart-scroller {
  /* 确保scroller填满容器 */
  height: 100%;
}

/* 确保卡片之间有间距（如果需要） */
.van-swipe-cell {
  margin-bottom: 10px;
}

.delete-button {
  height: 100%;
}

  </style>
  