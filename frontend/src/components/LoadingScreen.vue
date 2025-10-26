<script setup lang="ts">
import { onMounted } from 'vue'

const emit = defineEmits<{
  complete: []
}>()

onMounted(() => {
  // Complete after 1.5 seconds
  setTimeout(() => {
    emit('complete')
  }, 1500)
})
</script>

<template>
  <div class="loading-screen">
    <div class="loading-content">
      <!-- Loading Spinner -->
      <div class="spinner-container">
        <div class="spinner"></div>
      </div>
      
      <!-- Loading Message -->
      <p class="loading-message">Herinneringen laden...</p>
    </div>
  </div>
</template>

<style scoped>
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-background);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-content {
  text-align: center;
}

.spinner-container {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid var(--color-background-secondary);
  border-top-color: var(--color-text-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-message {
  font-size: 1rem;
  color: var(--color-text-secondary);
  margin: 0;
}

@media (max-width: 768px) {
  .spinner {
    width: 40px;
    height: 40px;
  }
  
  .loading-message {
    font-size: 0.9rem;
  }
}
</style>

