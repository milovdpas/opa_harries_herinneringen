<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  audioUrl: string
  submitterName?: string
}>()

const audioRef = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)

const togglePlay = () => {
  if (!audioRef.value) return
  
  if (isPlaying.value) {
    audioRef.value.pause()
  } else {
    audioRef.value.play()
  }
  isPlaying.value = !isPlaying.value
}

const handleEnded = () => {
  isPlaying.value = false
}
</script>

<template>
  <div class="audio-player">
    <div class="audio-icon">🎵</div>
    
    <div class="player-controls">
      <button @click="togglePlay" class="play-btn">
        <span v-if="!isPlaying">▶️ Afspelen</span>
        <span v-else>⏸️ Pauzeren</span>
      </button>
    </div>
    
    <audio
      ref="audioRef"
      :src="audioUrl"
      @ended="handleEnded"
    ></audio>
    
    <div v-if="submitterName" class="submitter">
      Gedeeld door {{ submitterName }}
    </div>
  </div>
</template>

<style scoped>
.audio-player {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
}

.audio-icon {
  font-size: 4rem;
  margin-bottom: 2rem;
  opacity: 0.6;
}

.player-controls {
  margin-bottom: 1.5rem;
}

.play-btn {
  padding: 1rem 2rem;
  font-size: 1.2rem;
  background: var(--color-text-primary);
  color: var(--color-background);
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.play-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.play-btn:active {
  transform: scale(0.95);
}

.submitter {
  font-size: 1rem;
  color: var(--color-text-secondary);
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .audio-icon {
    font-size: 3rem;
  }
  
  .play-btn {
    padding: 0.8rem 1.6rem;
    font-size: 1rem;
  }
}
</style>

