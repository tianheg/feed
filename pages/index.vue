<script setup>
import WebsiteCard from '~/components/WebsiteCard.vue'

//import { ref, onMounted } from 'vue';

const jsonData = ref([]);

const fetchData = async () => {
  try {
    const response = await fetch('/feeds-json.json');
    jsonData.value = await response.json();
  } catch (error) {
    console.error('Error fetching JSON data:', error);
  }
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div v-if="jsonData.length">
    <div v-for="item in jsonData" :key="item.Title">
      <WebsiteCard :title="item.Title" :url="item.Url" :desc="item.Desc" />
    </div>
  </div>
  <div v-else>
    <p>Loading...</p>
  </div>
</template>
