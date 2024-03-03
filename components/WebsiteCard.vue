<script setup>
const { title, url, desc } = defineProps({
  title: String,
  url: String,
  desc: String,
});

const alignment = ref("");
const borderColor = ref("");

const COLOR_RANGE = 16777215;

const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];
const getRandomColor = () => `#${Math.floor(Math.random() * COLOR_RANGE).toString(16)}`;

onMounted(() => {
  const alignments = ["left", "center", "right"];

  alignment.value = getRandomElement(alignments);
  borderColor.value = getRandomColor();
});
</script>

<template>
  <div
    class="website-card"
    :class="alignment"
    :style="{ borderColor: borderColor }"
  >
    <a :href="url" target="_blank" rel="nofollow noreferrer">
      <div class="title">{{ title }}</div>
      <p>{{ desc }}</p>
    </a>
  </div>
</template>

<style scoped>
.website-card {
  display: grid;
  padding: 10px 100px;
  border: 1px solid;
  border-radius: 10px;
}
.website-card.left {
  text-align: left;
}

.website-card.center {
  text-align: center;
}

.website-card.right {
  text-align: right;
}

a {
  color: black;
  text-decoration: none;
}
a:hover {
  color: hsl(220, 90%, 56%);
}
</style>
