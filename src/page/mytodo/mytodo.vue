<template>
    <div>
        <p>代办</p>
    </div>
</template>
  
<script setup>
import { ref, onMounted } from 'vue';
import http  from '@/api/request';
import { useUserStore } from '@/store/userStore';
const userStore = useUserStore();

const list = ref([])
const load = async() => {
    const res = await http.post('/public/api/getAllSubWp', {id:userStore.userInfo.userCode});
    console.log('所有下级: ',res);
    if (res && res.data) {
        list.value = res.data;
    }
}

onMounted(() => {
    load()
})

</script>
<style scoped>
</style>
  