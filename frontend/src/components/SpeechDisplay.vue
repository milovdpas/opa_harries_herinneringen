<script setup lang="ts">
const props = defineProps<{
  speech: string
  submitterName?: string
}>()
</script>

<template>
  <div class="speech-display">
    <div class="speech-header">
      <div class="speech-icon">📜</div>
      <h3 class="speech-title">Toespraak</h3>
    </div>
    
    <div class="speech-content">
      <div class="speech-text">
        {{ speech }}
      </div>
      
      <div v-if="submitterName" class="speech-author">
        — {{ submitterName }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.speech-display {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 2rem;
  background: var(--color-background-secondary);
}

.speech-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--color-border);
}

.speech-icon {
  font-size: 2.5rem;
  opacity: 0.7;
}

.speech-title {
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
  color: var(--color-text-primary);
}

.speech-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.speech-text {
  font-size: 1.1rem;
  line-height: 1.8;
  color: var(--color-text-primary);
  white-space: pre-wrap; /* Preserve line breaks */
  text-align: left;
}

.speech-author {
  font-size: 1.1rem;
  color: var(--color-text-secondary);
  font-weight: 500;
  font-style: italic;
  text-align: right;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

/* Custom scrollbar */
.speech-content::-webkit-scrollbar {
  width: 8px;
}

.speech-content::-webkit-scrollbar-track {
  background: var(--color-background);
  border-radius: 4px;
}

.speech-content::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}

.speech-content::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-secondary);
}

@media (max-width: 768px) {
  .speech-display {
    padding: 1.5rem;
  }
  
  .speech-title {
    font-size: 1.5rem;
  }
  
  .speech-icon {
    font-size: 2rem;
  }
  
  .speech-text {
    font-size: 1rem;
  }
  
  .speech-author {
    font-size: 1rem;
  }
}
</style>

