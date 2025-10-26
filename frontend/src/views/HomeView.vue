<script setup lang="ts">
// Home view for Opa Harrie's Herinneringen
import { ref } from 'vue'
import LoadingScreen from '@/components/LoadingScreen.vue'
import UnifiedMosaicView from '@/components/UnifiedMosaicView.vue'
import SubmissionForm from '@/components/SubmissionForm.vue'
import MemoryModal from '@/components/MemoryModal.vue'
import AudioController from '@/components/AudioController.vue'
import IntroPhotoCurtain from '@/components/IntroPhotoCurtain.vue'
import { useUIStore } from '@/stores/ui'
import { shareViaWhatsApp } from '@/utils/share'

const uiStore = useUIStore()

// Loading and intro animation state
const showLoading = ref(true)
const showIntro = ref(false)
const mosaicReady = ref(false)
const showMosaicHint = ref(false)

const handleMosaicReady = () => {
  mosaicReady.value = true
  checkIfReadyForIntro()
}

const handleLoadingComplete = () => {
  checkIfReadyForIntro()
}

const checkIfReadyForIntro = () => {
  // Only show intro when both loading timer and mosaic are ready
  if (mosaicReady.value) {
    showLoading.value = false
    showIntro.value = true
  }
}

const handleIntroComplete = () => {
  showIntro.value = false
  // Show the hint now that user has entered the app
  showMosaicHint.value = true
}

const openSubmissionForm = () => {
  uiStore.openSubmissionForm()
}

const handleShare = () => {
  shareViaWhatsApp()
}

// Configuration
const REFERENCE_PHOTO = '/harrie.jpg'
const TARGET_CARDS = 6000
</script>

<template>
  <main>
    <!-- Loading Screen -->
    <LoadingScreen 
      v-if="showLoading"
      @complete="handleLoadingComplete"
    />

    <!-- Intro Animation -->
    <IntroPhotoCurtain 
      v-if="showIntro"
      @complete="handleIntroComplete"
    />

    <!-- Main Content (rendered but hidden during loading/intro so mosaic can initialize) -->
    <div>
      <header class="page-header" :style="{ visibility: (!showLoading && !showIntro) ? 'visible' : 'hidden' }">
        <h1>Opa Harrie's Herinneringen</h1>
      </header>

      <!-- Unified mosaic with mode switching (Abstract ↔ Realistic) -->
      <!-- Always rendered so it can emit ready event, but hidden during loading/intro -->
      <div :style="{ visibility: (!showLoading && !showIntro) ? 'visible' : 'hidden' }">
        <UnifiedMosaicView 
          :reference-photo-url="REFERENCE_PHOTO" 
          :target-cards="TARGET_CARDS"
          :use-pregenerated="true"
          :show-hint-on-entry="showMosaicHint"
          @ready="handleMosaicReady"
        />
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons" v-show="!showLoading && !showIntro">
        <button class="share-btn" @click="handleShare" title="Deel via WhatsApp">
          <img class="share-icon" src="/whatsapp.png" alt="WhatsApp icon"/>
        </button>
        <button class="add-memory-btn" @click="openSubmissionForm">
          <span class="btn-icon">+</span>
          <span class="btn-text">Herinnering Delen</span>
        </button>
      </div>

      <!-- Submission Form Modal -->
      <SubmissionForm />
      
      <!-- Memory Gallery Modal -->
      <MemoryModal />
      
      <!-- Background Audio Controller -->
      <AudioController />
    </div>
  </main>
</template>

<style scoped>
main {
  min-height: 100vh;
  width: 100%;
}

.page-header {
  text-align: center;
  padding: 2rem 1rem 2rem 1rem;
  position: relative;
  z-index: 10;
  display: flex;
  justify-content: center;
  pointer-events: none;
}

h1 {
  margin-bottom: 1rem;
  font-size: 2.5rem;
  font-family: 'Playfair Display', serif;
  font-weight: 700;
  letter-spacing: -0.01em;
}

@media (max-width: 768px) {
  h1 {
    font-size: 1.8rem;
     max-width: 300px;
  }
}

/* Action Buttons Container */
.action-buttons {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1rem;
  z-index: 50;
}

/* Share Button */
.share-btn {
  width: 3.5rem;
  height: 3.5rem;
  cursor: pointer;
  background: transparent;
  border: transparent;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.share-btn:hover {
  transform: scale(1.1);
}

.share-icon {
  font-size: 1.5rem;
  line-height: 1;
}

/* Add Memory Button */
.add-memory-btn {
  background: var(--color-text-primary);
  color: var(--color-background);
  border: none;
  border-radius: 50px;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.add-memory-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5);
}

.btn-icon {
  font-size: 1.5rem;
  line-height: 1;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .action-buttons {
    bottom: 1rem;
    right: 1rem;
  }
  
  .share-btn {
    width: 3rem;
    height: 3rem;
  }
  
  .share-icon {
    font-size: 1.3rem;
  }
  
  .add-memory-btn {
    padding: 0.875rem 1.5rem;
    font-size: 1rem;
  }
  
  .btn-text {
    display: none;
  }
  
  .btn-icon {
    font-size: 2rem;
  }
}
</style>
