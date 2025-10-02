<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CardData } from '@/types'
import { useUIStore } from '@/stores/ui'

const props = defineProps<{
  card: CardData
}>()

const uiStore = useUIStore()

// Check if card is clickable (not transparent)
const isClickable = computed(() => {
  const alpha = props.card.alpha ?? 1
  return alpha >= 0.1 // Only clickable if not transparent
})

// Handle card click
const handleClick = () => {
  // Don't open if panning/zooming
  if (!isClickable.value || uiStore.isPanning) {
    return
  }
  
  if (props.card.isEmpty) {
    // Empty card: open submission form with this position pre-selected
    uiStore.selectCard(props.card.position)
    uiStore.openSubmissionForm()
  } else {
    // Filled card: open memory modal
    uiStore.openMemory(props.card.position)
  }
}

const cardStyle = computed(() => {
  // Always show the background color (for mosaic effect)
  const alpha = props.card.alpha ?? 1
  
  // If alpha is very low, make card nearly invisible (shows dark background)
  if (alpha < 0.1) {
    return {
      backgroundColor: 'transparent',
      opacity: 0,
    }
  }
  
  return {
    backgroundColor: props.card.backgroundColor,
    opacity: alpha,
  }
})

const isEmpty = computed(() => props.card.isEmpty)
</script>

<template>
  <div 
    class="memory-card" 
    :class="{ empty: isEmpty, clickable: isClickable, transparent: !isClickable }"
    :style="cardStyle"
    :title="isClickable ? (isEmpty ? 'Klik om herinnering toe te voegen' : 'Klik om herinnering te bekijken') : ''"
    @click="handleClick"
  >
    <!-- Empty card: shows "+" on hover -->
    <div v-if="isEmpty" class="empty-overlay">
      <span class="add-icon">+</span>
    </div>

    <!-- Filled card: shows memory photo -->
    <div v-else class="memory-photo">
      <img 
        v-if="card.memory?.photoUrl" 
        :src="card.memory.photoUrl" 
        :alt="`Memory by ${card.memory.submitterName || 'Unknown'}`"
        loading="lazy"
      />
    </div>
  </div>
</template>

<style scoped>
.memory-card {
  aspect-ratio: 1;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: transform var(--transition-fast);
}

.memory-card.clickable {
  cursor: pointer;
}

.memory-card.clickable:hover {
  transform: scale(1.05);
  z-index: 10;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.memory-card.transparent {
  pointer-events: none; /* Not clickable */
  cursor: default;
}

/* Empty card overlay */
.empty-overlay {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.add-icon {
  font-size: 0.6rem;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.8);
}

/* Adjust icon size based on card size */
@media (min-width: 1400px) {
  .add-icon {
    font-size: 0.8rem;
  }
}

.memory-card.empty:hover .empty-overlay {
  opacity: 1;
  background: rgba(255, 255, 255, 0.15);
}

/* Memory photo display */
.memory-photo {
  width: 100%;
  height: 100%;
  position: relative;
}

.memory-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  /* Blend the photo with the background color to maintain mosaic effect */
  mix-blend-mode: multiply;
  opacity: 0.85;
}

/* Responsive: smaller cards on mobile */
@media (max-width: 768px) {
  .memory-card {
    border-width: 0.5px;
  }
}
</style>

