<script setup lang="ts">
import { ref, onMounted } from 'vue'

const audioRef = ref<HTMLAudioElement | null>(null)
const isMuted = ref(false)
const isPlaying = ref(false)
const defaultVolume = 0.1 // 10% volume (soft background music)

// Auto-start audio on first user interaction
const startAudio = () => {
  if (audioRef.value && !isPlaying.value) {
    audioRef.value.volume = defaultVolume // Set lower volume
    audioRef.value.play().catch(err => {
      console.log('Audio autoplay prevented, waiting for user interaction:', err)
    })
    isPlaying.value = true
  }
}

// Toggle mute
const toggleMute = () => {
  if (audioRef.value) {
    audioRef.value.muted = !audioRef.value.muted
    isMuted.value = audioRef.value.muted
  }
}

// Start audio on first click/touch
onMounted(() => {
  const startOnInteraction = () => {
    startAudio()
    // Remove listeners after first interaction
    document.removeEventListener('click', startOnInteraction)
    document.removeEventListener('touchstart', startOnInteraction)
  }
  
  document.addEventListener('click', startOnInteraction, { once: true })
  document.addEventListener('touchstart', startOnInteraction, { once: true })
})
</script>

<template>
  <div class="audio-controller">
    <!-- Hidden audio element -->
    <audio
      ref="audioRef"
      src="/audio.mp3"
      loop
      preload="auto"
    ></audio>
    
    <!-- Mute/Unmute button -->
    <button
      @click="toggleMute"
      class="audio-btn"
      :title="isMuted ? 'Geluid aan' : 'Geluid uit'"
    >
      <span v-if="isMuted">🔇</span>
      <span v-else>🔊</span>
    </button>
  </div>
</template>

<style scoped>
.audio-controller {
  position: fixed;
  top: 1rem;
  left: 1rem;
  z-index: 1000;
}

.audio-btn {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  background: var(--color-background-secondary);
  color: var(--color-text-primary);
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}

.audio-btn:hover {
  background: var(--color-text-primary);
  color: var(--color-background);
  transform: scale(1.1);
}

.audio-btn:active {
  transform: scale(0.95);
}

@media (max-width: 768px) {
  .audio-btn {
    width: 2.5rem;
    height: 2.5rem;
    font-size: 1.25rem;
  }
}
</style>

