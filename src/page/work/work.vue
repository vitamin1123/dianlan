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
        <van-list>
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
        </van-list>
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
      <van-swipe-cell v-for="(item,index) in cart">
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
        <!-- <template #footer>
          <van-tag type="danger">{{ item.baseprice }}</van-tag>
        </template> -->
      </van-card>
        <template #right>
          <van-button square type="danger" text="删除" @click="delCart(index)" class="delete-button"/>
        </template>
      </van-swipe-cell>
      
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
        :price="item.fa_price ? item.baseprice + ' + ' + (parseFloat(item.fa_price).toFixed(2)): item.baseprice.toString()"
        :origin-price="(parseFloat(item.baseprice)+parseFloat(item.fa_price)).toFixed(2)"
        :desc="item.model+'  '+ item.specification"
       
        :title="item.daihao"
        
        style="--van-card-font-size: 0.4rem;"
        >
        <template #tags>
          <van-tag v-if="item.proj"  type="primary" style="margin-right: 0.1rem;">{{ 'N'+item.proj.substr(-4) }}</van-tag>
            <van-tag v-if="item.facilities && item.facilities.trim() !== ''" plain type="primary" style="margin-right: 0.1rem;">{{ item.facilities }}</van-tag>
            <van-tag v-if="item.facilities_loca && item.facilities_loca.trim() !== ''"  color="#ffe1e1" text-color="#ad0000" style="margin-right: 0.1rem;">{{ item.facilities_loca }}</van-tag>
            <van-tag v-if="item.facilities_name && item.facilities_name.trim() !== ''" plain color="#7232dd" style="margin-right: 0.1rem;">{{ item.facilities_name }}</van-tag>
            
        </template>
        <template #footer>
            <!-- <van-button v-if="userStore.userInfo.userRole < 4" :disabled="(item.last_fangxian && item.last_fangxian!=userStore.userInfo.userCode)" size="small" @click="laxian(item)">{{ item.fangxianren || '完成拉线' }}
:thumb="dianlanImage"
            </van-button> -->
            <van-button
              v-if="userStore.userInfo.userRole < 4"
              :disabled="(item.last_fangxian && item.last_fangxian !== userStore.userInfo.userCode) || item.paip!= null"
              :type="(item.last_fangxian && item.last_fangxian !== userStore.userInfo.userCode) ? 'warning' : 'default'"
              size="small"
              @click="laxian(item)"
            >{{ item.fangxianren || '完成拉线' }}</van-button>
            <van-button size="small" :disabled="item.paip != null" @click="addCart(item)">{{ item.paip || '选中' }}</van-button>
        </template>
      </van-card>
    </van-list>
  </van-pull-refresh>
</div>  



    <van-submit-bar :price="totalPrice" button-text="提交派工单" style="margin-bottom: 1.33rem;">
      <template #button>
        <van-action-bar-button type="warning" text="提交拉线" @click="onSubmit_laxian" style="border-top-left-radius: 0.5rem; border-bottom-left-radius: 0.5rem;"/>
        <van-action-bar-button type="danger" :disabled ="dis_sub" text="提交派工单" @click="onSubmit" style=" border-top-right-radius: 0.5rem;  border-bottom-right-radius: 0.5rem;"/>
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
        <!-- <template #tip>
            你的工作清单里有未全部完成的设备接线，待全部完成后结算 <span @click="onClickLink"></span>
        </template>  -->
    </van-submit-bar>
  </template>
  
  <script setup>
  import { ref, onMounted, watch, computed } from 'vue';
  import { showToast } from 'vant'
  import Pinyin from 'pinyin-match';
  import http from '@/api/request';
  import { showConfirmDialog  } from 'vant';
  import { useUserStore } from '@/store/userStore';
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
  const rightList = ref([]);
  const fieldValue = ref('');
  const showPicker = ref(false);
  const showCartPopup = ref(false);
  const pickerValue = ref([]);
  const searchQuery = ref([]);
  let lastRequestTime = 0;
  const throttleDelay = 1000; 

  const syn_loca = ref(true)
  const dis_sub = computed(() => {
  // 如果 cart 为空，或者有任意一个 last_fangxian 为空，则禁用按钮
  return cart.value.length === 0 || cart.value.some(item => !item.last_fangxian || item.last_fangxian.trim() === '');
});
  // Grid 项数据
  const gridItems = ref([
    { text: '公司', key: '公司' },
    { text: '船号', key: '船号' },
    { text: '代号', key: '代号' },
    { text: '型号', key: '型号' },
    { text: '规格', key: '规格' },
    { text: '设备', key: '设备' },
    { text: '设备地点', key: '设备地点' },
    { text: '总线长', key: '总线长' },
    { text: '系统名', key: '系统名' },
  ]);

  const rmCart = () => {
    cart.value = [];
    totalPrice.value = 0.00;
    showCartPopup.value = false;
  };


  const filterUsers = ref('');

  const confirmSubWp = async() => {
    
    console.log('confirmSubWp:', rightList.value);
    console.log('confirmSubWp:', cart.value);
    const res = await http.post('/public/api/add_wp', {
      ope: userStore.userInfo.userCode,
      dianlan: cart.value.map(item => item.id),
      user: rightList.value.map(item => item.usercode),
    });
    console.log(res.data)
    if (res.code === 0) {
      showToast('派工成功');
      
      // 更新目标项的信息
      wp_user_picker.value = false;
    
      // 更新 cart 中的 last_fangxian 字段
      show_list.value.forEach(item => item.last_fangxian = userStore.userInfo.userCode);
      // 更新 show_list 中的paip 字段
      show_list.value.forEach(item => item.paip = userStore.userInfo.userName);
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
            const res = await http.post('/public/api/batch_laxian', {
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
              http.post('/public/api/batch_laxian', {
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
        const res = await http.post('/public/api/batch_laxian', {
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
      const res = await http.post('/public/api/laxian', {
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
    cart.value.splice(index, 1);
    totalPrice.value = cart.value.reduce((total, item) => total + item.baseprice*100, 0);
    console.log('车内容：', cart.value);
  };

  const addAll2Cart = () => {
    console.log('尝试添加所有到车：', show_list.value);

    // 筛选出未在购物车中的商品
    const newItems = show_list.value.filter(item => 
      (!cart.value.some(cartItem => cartItem.id === item.id)) && !item.paip
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
    const res = await http.post('/public/api/search_loca', {
        ope: userStore.userInfo.userCode
      });
      console.log('拉线： ', res.data);
      console.log(convertToTree(res.data));
      columns.value = convertToTree(res.data)
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
          const res = await http.post('/public/api/cancel_laxian', {
            ope: null,
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
      const res = await http.post('/public/api/search_loca', {
        ope: userStore.userInfo.userCode
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
    '代号': '',
    '型号': '',
    '规格': '',
    '设备': '',
    '设备地点': '',
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
      facilities_loca: searchWords.value['设备地点'],
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
      console.log('select------searchWords.value: ',searchWords.value);
      page.value = 0;
      const responseData = await fetchData();
      console.log('返回电缆值：', responseData.totalCount,responseData.data);
      show_list.value = responseData.data;
      showTop.value = false; 
    } catch (error) {
      console.error('处理请求时出错:', error);
    }
  };


const handlePopupClose = () => {

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
};
  

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
      'facilities_loca': sw.value=='设备地点'?search_word.value:searchWords.value['设备地点'],
      'total_length': sw.value=='总线长'?search_word.value:searchWords.value['总线长'],
      'sysname': sw.value=='系统名'?search_word.value:searchWords.value['系统名'],
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
      }else if (sw.value=='设备地点'){
        tmp.push({ key: i, title: response.data[i]['facilities_loca'] });
      }else if (sw.value=='总线长'){
        tmp.push({ key: i, title: response.data[i]['total_length'] });
      }else if (sw.value=='系统名'){
        tmp.push({ key: i, title: response.data[i]['sysname'] });
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

  const loadSearchWords = async() => {
      const savedSearchWords = localStorage.getItem('searchWords');
      
      if (savedSearchWords) {
        searchWords.value = JSON.parse(savedSearchWords);
        gridItems.value = gridItems.value.map(item => {
          return {
            ...item,
            text: searchWords.value[item.key] || item.text
          };
        });
        selected.value = gridItems.value.map(item => {
          return searchWords.value[item.key] ? true : false;
        });
        const responseData = await fetchData();
        console.log('返回电缆值：', responseData.totalCount,responseData.data);
        show_list.value = responseData.data;


        console.log('parse---savedSearchWords: ',searchWords.value);
      }
    };

  const loadAllUser = async() => {
      const url = '/public/api/get_all_user';
      const response = await http.get(url);
      console.log('返回值：',response.data)
      // all_user.value = response.data;
      filteredLeftList.value = response.data;
      leftList.value = response.data;
  };

  const saveSearchWords = () => {
    localStorage.setItem('searchWords', JSON.stringify(searchWords.value));
    console.log('searchWords saved: ',localStorage.getItem('searchWords'));
  };

  watch(searchWords, () => {
    console.log('searchWords changed: ',searchWords.value);
    saveSearchWords();
  }, { deep: true });

  onMounted( async() => {
    await loadSearchWords();
    await loadAllUser();
    console.log("首页加载啦; ",userStore.userInfo);
 
  })
  

  

  </script>
  
  <style scoped>
  /* 样式根据需要自定义 */
  .card-container {
    margin-bottom: 3.5rem; /* 给内容容器添加底部外边距，避免被 submit-bar 遮挡 */
    overflow-y: auto; /* 保证内容可以滚动 */
    max-height: calc(100vh - 100px); /* 动态调整高度 */
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
  </style>
  