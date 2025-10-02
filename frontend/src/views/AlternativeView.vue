<script setup lang="ts">
// Alternative mosaic view - Canvas-based with OpenSeadragon zoom
import AlternativeMosaicCanvas from '@/components/AlternativeMosaicCanvas.vue'
import SubmissionForm from '@/components/SubmissionForm.vue'
import MemoryModal from '@/components/MemoryModal.vue'
import AudioController from '@/components/AudioController.vue'
import { useUIStore } from '@/stores/ui'
import { shareViaWhatsApp } from '@/utils/share'

const uiStore = useUIStore()

const openSubmissionForm = () => {
  uiStore.openSubmissionForm()
}

const handleShare = () => {
  shareViaWhatsApp()
}

// Configuration
const REFERENCE_PHOTO = '/harry.jpg' // Same as home page
const TARGET_CARDS = 400 // Approximately 44x33 grid (half of original 89x67)
</script>

<template>
  <main>
    <header class="page-header">
      <h1>Opa Harry's Herinneringen</h1>
      <p class="subtitle">Alternative Visualization</p>
    </header>

    <!-- Canvas-based mosaic with OpenSeadragon -->
    <AlternativeMosaicCanvas 
      :reference-photo-url="REFERENCE_PHOTO" 
      :target-cards="TARGET_CARDS"
      :use-pregenerated="false"
      :scale-factor="0.5"
    />

    <!-- Action Buttons -->
    <div class="action-buttons">
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
  </main>
</template>

<style scoped>
main {
  min-height: 100vh;
  width: 100%;
}

.page-header {
  text-align: center;
  padding: 2rem 1rem 1rem;
  position: relative;
}

h1 {
  margin-bottom: 0.5rem;
  font-size: 2.5rem;
}

.subtitle {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  margin: 0;
}

@media (max-width: 768px) {
  h1 {
    font-size: 1.8rem;
  }
  
  .subtitle {
    font-size: 0.8rem;
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
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.share-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
  transform: scale(1.1);
}

.share-icon {
  width: 1.5rem;
  height: 1.5rem;
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
    width: 1.3rem;
    height: 1.3rem;
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

