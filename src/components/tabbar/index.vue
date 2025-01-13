<!-- <template>
<van-tabbar replace v-model="active"  active-color="#ff9a00" inactive-color="#979797">
  <van-tabbar-item to="/" icon="home-o">主页</van-tabbar-item>
  <van-tabbar-item to="mine" icon="friends-o" badge="15">我的</van-tabbar-item>

</van-tabbar>


</template>

<script setup>
import { ref }  from "vue"

const active = ref(0)
</script>

<style lang="less" scoped>      

</style> -->
<template>
  <van-tabbar replace v-model="active" active-color="#ff9a00" inactive-color="#979797">
    <van-tabbar-item to="/" icon="home-o">主页</van-tabbar-item>
    <van-tabbar-item v-if="userStore.userInfo.userRole < 5" to="work" icon="cluster-o">拉线派工</van-tabbar-item>
    <van-tabbar-item to="mine" icon="friends-o" :badge="daibanStore.daiban">我的</van-tabbar-item>
  </van-tabbar>


</template>

<script setup>
import { ref } from 'vue';
import { useUserStore } from '@/store/userStore';
import { useDaibanStore } from '@/store/daibanStore'
const daibanStore = useDaibanStore();
const userStore = useUserStore();
const active = ref(0);
</script>

<style lang="less" scoped></style>

