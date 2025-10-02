<script setup lang="ts">
const props = defineProps<{
  videoUrl: string
  submitterName?: string
}>()
</script>

<template>
  <div class="video-player">
    <div class="video-container">
      <video
        :src="videoUrl"
        controls
        class="video-element"
      ></video>
    </div>
    
    <div v-if="submitterName" class="submitter">
      Gedeeld door {{ submitterName }}
    </div>
  </div>
</template>

<style scoped>
.video-player {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
}

.video-container {
  width: 100%;
  max-width: 800px;
  margin-bottom: 1.5rem;
}

.video-element {
  width: 100%;
  height: auto;
  border-radius: 8px;
  background: #000;
}

.submitter {
  font-size: 1rem;
  color: var(--color-text-secondary);
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .video-player {
    padding: 1rem;
  }
}
</style>

