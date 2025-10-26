<script setup lang="ts">
defineProps<{
  size?: number
  color?: string
}>()
</script>

<template>
  <img
    src="/heart.svg"
    :width="size || 24"
    :height="size || 24"
    alt="Heart"
    class="heart-icon"
    :style="{ filter: color === 'white' ? 'brightness(0) invert(1)' : '' }"
  />
</template>

<style scoped>
.heart-icon {
  display: block;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}
</style>

