<script setup>
const { props } = defineProps(['title', 'url', 'desc'])
</script>

<template>
    <div class="website-card">
        <a :href="url" target="_blank" rel="nofollow noreferrer">
            <h2>{{ title }}</h2>
            <p>{{ desc }}</p>
        </a>
    </div>
</template>

<style scoped>
.website-card {
  display: grid;
  grid-template-rows: max-content 200px 1fr;
  height: 500px;
  padding: 15px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  color: #333;
  font-family: Arial, sans-serif;

  a {
    text-underline-offset: .4rem;
    text-decoration: underline dashed;
    color: #333;
  }
  a:hover {
    text-decoration: none;
    color: hsl(220, 90%, 56%);
  }
}
</style>