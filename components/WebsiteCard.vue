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
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 10px;
    margin: 10px;
}
</style>