<template>
    <div>
    <div v-if="imageSrc">
        
        <!-- <img :src="imageSrc" alt="汉字图片" /> -->
    </div>
    <van-cell title="单元格"  size="large"  style="margin-top: 1rem;">
        <template #title>
            <div class="container">
                <van-image
                    width="2rem"
                    height="2rem"
                    fit="cover"
                    :src="imageSrc"
                />
                <div class="text-content">
                    <p class="name">{{ username }}</p>
                    <p class="role">{{ rolename }}</p>
                </div>
            </div>
        </template>
    </van-cell>
    <van-cell v-if="[1,2,3,4].includes(roleid)" title="我的派工单"  size="large"  is-link to="mywp"> 
    </van-cell>
    <van-cell v-if="[1,2,3].includes(roleid)" title="我的拉线"  size="large" is-link to="mytodo"> 
       
    </van-cell>
    <van-cell v-if="[1,2,3].includes(roleid)" title="我的待办"  size="large" label="审批" is-link to="mytodo"> 
        <template #value>
            
            <van-tag type="danger">10待办</van-tag>
        </template>
    </van-cell>
    <van-cell v-if="[1,2].includes(roleid)" title="统计"  size="large"  is-link to="myana"> 
        
    </van-cell>
    <van-cell v-if="[1,2].includes(roleid)" title="人员管理"  size="large"  is-link to="usermana"> 
        
      </van-cell>
    <van-cell v-if="[1,2].includes(roleid)" title="区域设置"  size="large"  is-link to="locamana"> 
        
      </van-cell>
    <van-cell v-if="[1,2].includes(roleid)" title="区域班组设置"  size="large"  is-link to="locauser"> 
        
      </van-cell>

      <van-cell v-if="[1,2].includes(roleid)" title="系列项目设置"  size="large"  is-link to="se-proj"> 
        
      </van-cell>

      <van-cell v-if="[1,2].includes(roleid)" title="系列船电缆册"  size="large"  is-link to="seriesbook"> 
        
      </van-cell>

      <van-cell v-if="[1,2].includes(roleid)" title="电缆定额"  size="large"  is-link to="dianlan_baseprice"> 
        
      </van-cell>
      <van-cell v-if="[1,2].includes(roleid)" title="设备定额"  size="large"  is-link to="ep_baseprice"> 
        
      </van-cell>
      
      <canvas ref="canvas" width="100" height="100" style="display: none;"></canvas>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import http  from '@/api/request';
  import { useUserStore } from '@/store/userStore';
  const userStore = useUserStore();
  
  const text = ref(''); // 存储输入的汉字
  const imageSrc = ref(''); // 存储生成的图片 URL
  const username = ref('');
  const rolename = ref('');
  const roleid = ref(-1);
  
  const generateImage = () => {
    const canvas = document.createElement('canvas'); // 或使用 refs 获取 canvas
    const ctx = canvas.getContext('2d');
  
    // 设置 Canvas 尺寸
    canvas.width = 130;
    canvas.height = 130;
  
    // 清空画布并设置背景颜色为浅蓝色
    ctx.fillStyle = '#add8e6'; // 浅蓝色背景
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  
    // 设置字体和样式
    ctx.fillStyle = '#ffffff'; // 白色文字
    ctx.font = '80px Arial'; // 字体大小和样式
    ctx.textAlign = 'center'; // 居中对齐
    ctx.textBaseline = 'middle'; // 垂直居中
  
    // 绘制汉字
    ctx.fillText(text.value, canvas.width / 2, canvas.height / 2);
  
    // 导出图片为 Data URL
    imageSrc.value = canvas.toDataURL('image/png');
  };

  const fetchData = async () => {
    try {
        const response = await http.post('/public/api/gaga_post', { gaga: '10030203' });
        console.log('Response:', response.data);
        text.value = response.data[0]['username'][0]
        username.value = response.data[0]['username']
        rolename.value = response.data[0]['rolename']
        roleid.value = response.data[0]['roleid']
        userStore.userInfo.userName = response.data[0]['username']
        userStore.userInfo.userRole = response.data[0]['roleid']
        userStore.userInfo.userCode = response.data[0]['usercode']
    } catch (error) {
        console.error('Error:', error);
    }
};


  onMounted(async (res) => {
    
    await fetchData()
    generateImage()
    let result = await http.get('/public/api/gaga').catch((err)=>{
      console.log(err)
    });
    console.log(result)
 
  })

</script>
  
<style scoped>
img {
    margin-top: 20px;
    border: 1px solid #ccc;
    padding: 10px;
    background: #f9f9f9;
  }
.container {
  display: flex;
  align-items: center;
}

.text-content {
  margin-left: 0.5rem; /* 设置图片和文字之间的间距 */
}

.name {
  font-size: 0.5rem; /* 调整名字的字体大小 */
  font-weight: bold; /* 加粗名字 */
  margin: 0; /* 去除默认边距 */
}

.role {
  font-size: 0.4rem; /* 调整角色的字体大小 */
  color: gray; /* 设置灰色文字 */
  margin: 0; /* 去除默认边距 */
}
  </style>
  