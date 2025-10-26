<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { gsap } from 'gsap'
import { useMemoriesStore } from '@/stores/memories'

const emit = defineEmits<{
  complete: []
}>()

const memoriesStore = useMemoriesStore()
const showButton = ref(false)
const photos = ref<Array<{ id: number; x: number; y: number; rotation: number; delay: number; imageUrl?: string }>>([])

onMounted(async () => {
  // Get real memories from Firebase
  const memories = memoriesStore.memories
  const memoryImages = memories.filter(m => m.photoUrl).map(m => m.photoUrl)
  
  // Generate random photo positions with real images or gradients
  const photoCount = 20
  for (let i = 0; i < photoCount; i++) {
    photos.value.push({
      id: i,
      x: Math.random() * 100 - 50, // -50 to 50
      y: Math.random() * 100 - 50,
      rotation: Math.random() * 40 - 20, // -20 to 20 degrees
      delay: Math.random() * 0.5,
      // If no memories, imageUrl will be undefined and gradient fallback will be used
      imageUrl: memoryImages.length > 0 ? memoryImages[i % memoryImages.length] : undefined,
    })
  }

  // Wait for DOM to update with photo elements
  await nextTick()
  
  // Small delay to ensure elements are fully rendered
  setTimeout(() => {
    startAnimation()
  }, 100)
})

const startAnimation = () => {
  const photoItems = document.querySelectorAll('.photo-item')
  
  if (photoItems.length === 0) {
    return
  }

  const timeline = gsap.timeline()

  // Phase 1: Photos float in (1.5s)
  timeline.fromTo('.photo-item', 
    {
      scale: 0,
      opacity: 0,
      x: (index) => (photos.value[index]?.x ?? 0) + '%',
      y: (index) => (photos.value[index]?.y ?? 0) + '%',
      rotation: (index) => photos.value[index]?.rotation ?? 0,
    },
    {
      scale: 1,
      opacity: 1,
      x: (index) => (photos.value[index]?.x ?? 0) + '%',
      y: (index) => (photos.value[index]?.y ?? 0) + '%',
      rotation: (index) => photos.value[index]?.rotation ?? 0,
      duration: 0.8,
      stagger: 0.05,
      ease: 'back.out(1.7)',
    }
  )

  // Phase 2: Photos drift gently (1.5s)
  timeline.to('.photo-item', {
    x: '+=20',
    y: '+=20',
    rotation: '+=10',
    duration: 1.5,
    stagger: 0.02,
    ease: 'sine.inOut',
    repeat: 1,
    yoyo: true,
  })

  // Phase 3: Photos arrange into grid (1.5s)
  const isMobile = window.innerWidth <= 768
  const spacing = isMobile ? 65 : 80 // Smaller spacing on mobile
  
  timeline.to('.photo-item', {
    x: (index) => {
      const col = index % 5
      const row = Math.floor(index / 5)
      return (col - 2) * spacing // Center the grid
    },
    y: (index) => {
      const row = Math.floor(index / 5)
      return (row - 2) * spacing // Center the grid
    },
    rotation: 0,
    scale: 0.8,
    duration: 1.2,
    stagger: 0.03,
    ease: 'power2.inOut',
  })

  // Phase 4: Fade out photos and show title (1s)
  timeline.to('.photo-item', {
    opacity: 0,
    scale: 1.2,
    duration: 0.8,
    stagger: 0.02,
    ease: 'power2.in',
  })

  // Show title
  timeline.to('.intro-title', {
    opacity: 1,
    y: 0,
    duration: 0.8,
    ease: 'power2.out',
    onComplete: () => {
      // After title is shown, show button and animate it
      showButton.value = true
      // Use nextTick to wait for Vue to render the button
      nextTick().then(() => {
        gsap.to('.enter-button', {
          opacity: 1,
          scale: 1,
          duration: 0.6,
          ease: 'back.out(1.7)',
        })
      })
    }
  }, '-=0.4')
}

const enter = () => {
  gsap.to('.intro-container', {
    opacity: 0,
    duration: 0.5,
    onComplete: () => {
      emit('complete')
    }
  })
}
</script>

<template>
  <div class="intro-container photo-curtain" style="pointer-events: auto;">
    <!-- Floating Photos -->
    <div class="photos-container">
      <div
        v-for="photo in photos"
        :key="photo.id"
        class="photo-item"
      >
        <!-- Real memory photos or gradient fallback -->
        <div class="photo-placeholder" :class="{ 'has-image': photo.imageUrl }">
          <img 
            v-if="photo.imageUrl" 
            :src="photo.imageUrl" 
            alt="Memory" 
            class="photo-image"
          />
        </div>
      </div>
    </div>

    <!-- Title Overlay -->
    <div class="intro-title">
      <h1>Opa Harrie's Herinneringen</h1>
    </div>

    <!-- Enter Button -->
    <button
      v-if="showButton"
      class="enter-button"
      @click="enter"
    >
      Betreed Harrie's Herinneringen
    </button>
  </div>
</template>

<style scoped>
.intro-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-background);
  z-index: 20000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.photos-container {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo-item {
  position: absolute;
  width: 80px;
  height: 80px;
  opacity: 0;
}

.photo-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  position: relative;
}

.photo-placeholder.has-image {
  background: #1a1a1a;
}

.photo-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.intro-title {
  position: absolute;
  text-align: center;
  opacity: 0;
  transform: translateY(20px);
}

.intro-title h1 {
  font-family: 'Playfair Display', serif;
  font-size: 3rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.enter-button {
  position: absolute;
  bottom: 4rem;
  padding: 1rem 2.5rem;
  font-family: 'Playfair Display', serif;
  font-size: 1.1rem;
  font-weight: 600;
  background: var(--color-text-primary);
  color: var(--color-background);
  border: none;
  border-radius: 50px;
  cursor: pointer;
  opacity: 0;
  transform: scale(0.8);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.enter-button:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

@media (max-width: 768px) {
  .intro-title h1 {
    font-size: 2rem;
    padding: 0 1rem;
  }
  
  .photo-item {
    width: 60px;
    height: 60px;
  }
  
  .enter-button {
    bottom: 2rem;
    padding: 0.875rem 2rem;
    font-size: 1rem;
  }
}
</style>

