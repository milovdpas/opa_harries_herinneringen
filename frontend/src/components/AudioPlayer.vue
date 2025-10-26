<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  audioUrl: string
  submitterName?: string
}>()

const audioRef = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const volume = ref(100) // 0-100

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

const updateVolume = (event: Event) => {
  if (!audioRef.value) return
  const target = event.target as HTMLInputElement
  volume.value = parseInt(target.value)
  audioRef.value.volume = volume.value / 100
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
      
      <div class="volume-control">
        <span class="volume-icon">🔊</span>
        <input 
          type="range" 
          min="0" 
          max="100" 
          :value="volume" 
          @input="updateVolume"
          class="volume-slider"
          aria-label="Volume"
        />
        <span class="volume-label">{{ volume }}%</span>
      </div>
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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
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

.volume-control {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  width: 100%;
  max-width: 250px;
}

.volume-icon {
  font-size: 1.2rem;
  opacity: 0.7;
}

.volume-slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.2);
  outline: none;
  cursor: pointer;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.volume-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
}

.volume-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-text-primary);
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.volume-slider::-moz-range-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
}

.volume-label {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  min-width: 45px;
  text-align: right;
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

  .volume-control {
    max-width: 200px;
    gap: 0.6rem;
  }

  .volume-icon {
    font-size: 1rem;
  }

  .volume-label {
    font-size: 0.8rem;
    min-width: 40px;
  }
}
</style>

