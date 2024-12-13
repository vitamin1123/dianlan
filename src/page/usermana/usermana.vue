<template>
    <van-floating-bubble
        v-if = "[1,2].includes(userStore.userInfo.userRole)"
        axis="xy"
        icon="plus"
        magnetic="x"
        @offset-change="onOffsetChange"
        @click="showTop = true"
        />
    
    <van-search v-model="sw" placeholder="请输入搜索关键词" style="position: sticky; top:0;z-index:10;"/>
    <div class="card-container">
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
          <van-button v-if="item.role==3" :plain="(item.locaname?true:false)" :color="(item.locaname?'#166ee3':'#e3168b')" size="small" @click="setLoca">{{ item.locaname || '设定区域' }} </van-button>
          <van-button :plain="(item.leadername?true:false)" :color="(item.leadername?'#a2768a':'#166ee3')" size="small" @click="setDleader">{{ item.leadername || '设定上级' }}</van-button>
        </template>
        
    </van-card>
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
                    @click="showPicker1 = true"
                    placeholder="选择上级"
                    :rules="['3','4'].includes(juese) ? [{ required: true, message: '请填写上级' }] : []"
                />
                <van-field
                    v-if="juese=='3'"
                    v-model="quyu"
                    type="digit"
                    name="区域"
                    label="区域"
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
        <van-search v-model="sw1" placeholder="请搜索直接上级" style="position: sticky; top:0;z-index:11;" @search="searchLeader"/>
        <van-picker
            :model-value="pickerValue1"
            :columns="columns1"
            @cancel="showPicker1 = false"
            @confirm="onConfirm1"
        />
    </van-popup>
    </div>
</template>
  
<script setup>
import { ref, onMounted } from 'vue';
import http  from '@/api/request';
import { useUserStore } from '@/store/userStore';
import { showFailToast } from 'vant'
const userStore = useUserStore();
const list = ref([]);
const sw = ref('');
const sw1 = ref('');
const page = ref(0);
const showTop = ref(false);
const username = ref('');
const usercode = ref('');
const role_dic = ref({
    1: '超级管理员',
    2: '管理员',
    3: '班组长',
    4: '施工员',
})
const tag_dic = ref({
    1: '#DC143C',
    2: '#7232dd',
    3: '#4169E1',
    4: 'warning',
})
const searchUserCode = async () => {
    console.log('搜索： ',usercode.value)
    const res = await http.post('/public/api/search_user_code', {'code': usercode.value});
    if (res.data.length > 0) {
        usercode.value = res.data[0].username;
        showFailToast('工号已经存在！');
    } else {
        username.value = '';
    }
    console.log(res.data)
}

const columns = [
      { text: '管理员', value: '2' },
      { text: '班组长', value: '3' },
      { text: '施工员', value: '4' }
    ];
const fieldValue = ref('');
const juese = ref('');
const showPicker = ref(false);
const showPicker1 = ref(false);
const pickerValue = ref([]);
const onConfirm = ({ selectedValues, selectedOptions }) => {
    showPicker.value = false;
    pickerValue.value = selectedValues;
    fieldValue.value = selectedOptions[0].text;
    juese.value = selectedOptions[0].value;
};
const columns1 = ref([]);
const fieldValue1 = ref('');
const shangji = ref('');
const pickerValue1 = ref([]);
const onConfirm1 = ({ selectedValues, selectedOptions }) => {
    showPicker1.value = false;
    pickerValue1.value = selectedValues;
    fieldValue1.value = selectedOptions[0].text;
    shangji.value = selectedOptions[0].value;
};

const searchLeader = async () => {
    console.log('搜索： ',sw1.value)
    const res = await http.post('/public/api/get_leader_list', {'sw': sw1.value});
    columns1.value = res.data.map(item => ({ text: item.username, value: item.usercode }));
    console.log(res.data)
    console.log(columns1.value)
}

const onSubmit = async () => {
  
    showTop.value = false;
}

const setLoca = async (item) => {
    showTop.value = true;
}

const setDleader = async (item) => {
    
}

const onOffsetChange = (offset) => {
    // 处理偏移量变化的逻辑
    console.log(offset);
};
const load = async () => {
    const res = await http.post('/public/api/get_user_list', { page:  page.value*1 });
    console.log(res.data)
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
  