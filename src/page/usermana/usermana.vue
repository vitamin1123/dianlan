<template>
    <van-floating-bubble
        v-if = "[1,2].includes(userStore.userInfo.userRole)"
        axis="xy"
        icon="plus"
        magnetic="x"
        @offset-change="onOffsetChange"
        @click="showTop = true"
        />
    
    <van-search v-model="sw" placeholder="请输入搜索关键词" style="position: sticky; top:0;z-index:10;" @search="search_user"/>
    <div class="card-container">
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
    <van-list
      v-model:loading="loading"
      :finished="finished"
      finished-text="没有更多了"
      @load="onLoad"
    >
    <van-card
        v-for="(item,index) in list"
        :price="item.baseprice"
        :desc="item.usercode"
        :tag="item.role+''"
        :title="item.username"
        
        style="--van-card-font-size: 0.4rem;"
        >
        <template #tags>
            <van-tag v-if="item.role"  :color="tag_dic[item.role]" style="margin-right: 0.1rem;">{{ role_dic[item.role] }}</van-tag>
            <van-tag v-if="item.facilities_loca" plain type="primary" style="margin-right: 0.1rem;">{{ item.facilities_loca }}</van-tag>
            <van-tag v-if="item.facilities_name" plain type="primary">{{ item.facilities_name }}</van-tag>
        </template>
        <template #footer>
          <van-button  :plain="(item.role?true:false)" :color="(item.role?'#166ee3':'#e3168b')" size="small" @click="setLoca(index,item)">{{ '修改角色' }} </van-button>
          <van-button  :color="(item.leadername?'#a2768a':'#166ee3')" size="small" @click="setDleader(index,item)">{{ item.leadername || '设定上级' }}</van-button>
        </template>
        
    </van-card>
    </van-list>
    </van-pull-refresh>
    </div>
    <van-popup v-model:show="showTop" position="bottom"  :style="{ height: '80%' }" @click-overlay="handlePopupClose">
        <van-form @submit="onSubmit">
            <van-cell-group inset>
                <van-field
                    v-model="username"
                    name="用户名"
                    label="用户名"
                    placeholder="用户名"
                    :rules="[{ required: true, message: '请填写用户名' }]"
                />
                <van-field
                    v-model="usercode"
                    type="digit"
                    name="工号"
                    label="工号"
                    placeholder="工号"
                    @blur="searchUserCode"
                    :rules="[{ required: true, message: '请填写工号' }]"
                />
                <van-field
                    v-model="fieldValue"
                    is-link
                    readonly
                    label="角色"
                    placeholder="选择角色"
                    @click="showPicker = true"
                    :rules="[{ required: true, message: '请选择角色' }]"
                    />
                <van-field
                    v-if="['3','4'].includes(juese)"
                    v-model="fieldValue1"
                    is-link
                    readonly
                    label="上级"
                    @click="ssw('上级')"
                    placeholder="选择上级"
                    :rules="['4','5'].includes(juese) ? [{ required: true, message: '请填写上级' }] : []"
                />
                <van-field
                    v-if="juese=='3'"
                    v-model="fieldValue2"
                    is-link
                    readonly
                    label="区域"
                    @click="ssw('区域')"
                    placeholder="区域"
                    :rules="juese === '3' ? [{ required: true, message: '请填写区域' }] : []"
                />
            </van-cell-group>
            <div style="margin: 16px;">
                <van-button round block type="primary" native-type="submit">
                提交
                </van-button>
            </div>
        </van-form>
    </van-popup>
    
    <van-popup v-model:show="showPicker" destroy-on-close round position="bottom">
        <van-picker
            :model-value="pickerValue"
            :columns="columns"
            @cancel="showPicker = false"
            @confirm="onConfirm"
        />
    </van-popup>
    <van-popup v-model:show="showPicker1" destroy-on-close round position="bottom" >
        <van-search v-model="sw1" placeholder="请搜索" style="position: sticky; top:0;z-index:11;" @search="searchLeader"/>
        <van-picker
            :model-value="pickerValue1"
            :columns="columns1"
            @cancel="showPicker1 = false"
            @confirm="onConfirm1"
        />
    </van-popup>
    <van-popup v-model:show="showPicker2" destroy-on-close round position="bottom" >
        <van-search v-model="sw1" placeholder="请搜索" style="position: sticky; top:0;z-index:11;" @search="searchLeader"/>
        <van-picker
            :model-value="pickerValue2"
            :columns="columns1"
            @cancel="showPicker2 = false"
            @confirm="onConfirm2"
        />
    </van-popup>
    
</template>
  
<script setup>
import { ref, onMounted } from 'vue';
import http  from '@/api/request';
import { useUserStore } from '@/store/userStore';
import { showFailToast,showSuccessToast,showToast } from 'vant'
const userStore = useUserStore();
const list = ref([]);
const sw = ref('');
const sw1 = ref('');
const quyu = ref('');
const search_type = ref('');
const page = ref(0);
const finished = ref(false);
const loading = ref(false);
const refreshing = ref(false);
const showTop = ref(false);
let lastRequestTime = 0;
const throttleDelay = 1000; 
const username = ref('');
const usercode = ref('');
const tmp1 = ref(null);
const role_dic = ref({
    1: '超级管理员',
    2: '管理员',
    3: '生产主管',
    4: '班组长',
    5: '施工员',
})
const tag_dic = ref({
    1: '#DC143C',
    2: '#7232dd',
    3: '#006400',
    4: '#4169E1',
    5: 'warning',
})
const searchUserCode = async () => {
    console.log('搜索： ',usercode.value)
    const res = await http.post('/public/api/search_user_code', {'code': usercode.value});
    if (res.data.length > 0) {
        usercode.value = res.data[0].username;
        showFailToast('工号已经存在！');
    } 
    console.log(res.data)
}

const columns = [
      { text: '管理员', value: '2' },
      { text: '生产主管', value: '3' },
      { text: '班组长', value: '4' },
      { text: '施工员', value: '5' }
    ];
const fieldValue = ref('');
const juese = ref('');
const showPicker = ref(false);
const showPicker1 = ref(false);
const pickerValue = ref([]);
const showPicker2 = ref(false);
const pickerValue2 = ref([]);
const isSetloca = ref(false)
const onConfirm = async({ selectedValues, selectedOptions }) => {
    showPicker.value = false;
    if (isSetloca.value) {
        console.log('设置角色： ',selectedOptions[0].value)
        const res = await http.post('/public/api/mod_user', {'sw': selectedOptions[0].value, 'type': search_type.value, 'user':tmp1.value});
        if (res.data.affectedRows == 1) {
            showSuccessToast('修改成功！');
            load()
        } 
        return;
    }else{
        
        pickerValue.value = selectedValues;
        fieldValue.value = selectedOptions[0].text;
        juese.value = selectedOptions[0].value;
    }
    
};
const columns1 = ref([]);
const fieldValue1 = ref('');
const fieldValue2 = ref('');
const shangji = ref('');
const pickerValue1 = ref([]);
const onConfirm1 = ({ selectedValues, selectedOptions }) => {
    showPicker1.value = false;
    pickerValue1.value = selectedValues;
    //fieldValue1.value = selectedOptions[0].text;
    if (search_type.value == '区域') {
        quyu.value = selectedOptions[0].value;
        fieldValue2.value = selectedOptions[0].text;
    }else if (search_type.value == '上级') {
        shangji.value = selectedOptions[0].value;
        fieldValue1.value = selectedOptions[0].text;
    }
    // shangji.value = selectedOptions[0].value;
    columns1.value = [];
    sw1.value = '';
};

const onConfirm2 = async({ selectedValues, selectedOptions }) => {
    showPicker2.value = false;
    pickerValue2.value = selectedValues;
    //fieldValue1.value = selectedOptions[0].text;
    const res = await http.post('/public/api/mod_user', {'sw': selectedOptions[0].value, 'type': search_type.value,'user':tmp1.value});
    console.log(res.data)  
    if (res.data.affectedRows == 1) {
        showSuccessToast('修改成功！');
        load()
    } 
    // shangji.value = selectedOptions[0].value;
    columns1.value = [];
    sw1.value = '';
};

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

const searchLeader = async () => {
    console.log('搜索11： ',sw1.value)
    const res = await http.post('/public/api/get_leader_list', {'sw': sw1.value, 'type': search_type.value});
    columns1.value = res.data.map(item => ({ text: item.username, value: item.usercode }));
    console.log(res.data)
    console.log(columns1.value)
}

const ssw = async (type) => {
    console.log('搜索： ',type)
    search_type.value = type;
    showPicker1.value = true;
}

const onSubmit = async () => {
    console.log('提交： ',username.value, usercode.value, juese.value, shangji.value, quyu.value)
    const res = await http.post('/public/api/add_user', {
        'username': username.value,
        'usercode': usercode.value,
        'role': juese.value,
        'shangji': shangji.value,
        'quyu': quyu.value
    });
    if(res.data.affectedRows == 1) {
        showSuccessToast('添加成功！');
        load()
        username.value = '';
        usercode.value = '';
        juese.value = '';
        shangji.value = '';
        quyu.value = '';
        fieldValue.value = '';
        fieldValue1.value = '';
        fieldValue2.value = '';
        showTop.value = false;
    }
    // showTop.value = false;
}

const setLoca = async (index,item) => {
    console.log('设定角色： ',index,item)
    search_type.value = '角色';
    showPicker.value = true
    isSetloca.value = true;
    tmp1.value = item;
}

const setDleader = async (index,item) => {
    search_type.value = '上级';
    showPicker2.value = true;
    console.log('设定上级： ',index,item)
    tmp1.value = item;
}

const onOffsetChange = (offset) => {
    // 处理偏移量变化的逻辑
    console.log(offset);
};

const search_user = async () => {
    console.log('搜索： ',sw.value)
    const res = await http.post('/public/api/get_user_list', { sw:sw.value,page:  0 });
    console.log('搜索user',res.data)
    list.value = res.data
    finished.value = true;
}

const fetchData = async () => {
    const now = Date.now();
    if (now - lastRequestTime < throttleDelay) {
      // loading.value = false;
      showToast('请求过于频繁，请稍后再试。');
      return null; // 如果在节流时间内，不执行函数
    }
    lastRequestTime = now;
    // 在 fetchData 中构造 sd 数据
    const url = '/public/api/get_user_list';
    const data = {
      sw: sw.value,
      page: page.value*10,
    };

    try {
      const response = await http.post(url, data);
      console.log('返回的用户值：', response);
      return { data:response.data,totalCount:response.totalCount};
    } catch (error) {
      console.error('请求失败:', error);
      throw error;
    }
  };

const onLoad = async () => {
        
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
        console.log('返回的用户值：', responseData.totalCount,responseData.data);
        for (let i = 0; i < responseData.data.length; i++) {
          list.value.push(responseData.data[i]);
        }
        loading.value = false;

        if (list.value.length >= responseData.totalCount) {
          finished.value = true;
        }
      
    };

const load = async () => {
    const res = await http.post('/public/api/get_user_list', { sw:null,page:  page.value*1 });
    console.log('初次加载： ',res.data,res.totalCount)
    list.value = res.data
}
const handlePopupClose = () => {
    showTop.value = false;
}


onMounted(() => {
    load()
    console.log(userStore.userInfo)
})

</script>
<style scoped>

.card-container {
    margin-bottom: 1.5rem; /* 给内容容器添加底部外边距，避免被 submit-bar 遮挡 */
    overflow-y: auto; /* 保证内容可以滚动 */
    max-height: calc(100vh - 100px); /* 动态调整高度 */
  }
</style>
  