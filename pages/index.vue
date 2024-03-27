<script setup>
import { ref, onMounted } from "vue";
import WebsiteCard from "~/components/WebsiteCard.vue";

const jsonData = ref([]);
const isLoading = ref(true);

const fetchData = async () => {
  isLoading.value = true;
  try {
    const response = await fetch("/feeds-json.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    jsonData.value = await response.json();
  } catch (error) {
    console.error("Error fetching JSON data:", error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchData);
</script>

<template>
  <div>
    <div v-if="!isLoading" class="website-card-container">
      <WebsiteCard
        v-for="item in jsonData"
        :key="item.Title"
        :title="item.Title"
        :url="item.Url"
        :desc="item.Desc"
      />
    </div>
    <div v-else>
      <p>Loading...</p>
    </div>
  </div>
</template>

<style>
:root {
  font-size: 16px;
  background-color: aliceblue;
}

.website-card-container {
  display: grid;
  grid-gap: 20px;
}
</style>
