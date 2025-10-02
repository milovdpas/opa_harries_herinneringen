<script setup lang="ts">
const props = defineProps<{
  quote: string
  submitterName?: string
}>()
</script>

<template>
  <div class="quote-display">
    <div class="quote-icon">💬</div>
    <blockquote class="quote-text">
      "{{ quote }}"
    </blockquote>
    <div v-if="submitterName" class="quote-author">
      — {{ submitterName }}
    </div>
  </div>
</template>

<style scoped>
.quote-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
  text-align: center;
}

.quote-icon {
  font-size: 3rem;
  margin-bottom: 1.5rem;
  opacity: 0.5;
}

.quote-text {
  font-size: 1.5rem;
  font-style: italic;
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
  color: var(--color-text-primary);
  max-width: 600px;
}

.quote-author {
  font-size: 1.1rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

@media (max-width: 768px) {
  .quote-text {
    font-size: 1.2rem;
  }
  
  .quote-icon {
    font-size: 2.5rem;
  }
}
</style>

