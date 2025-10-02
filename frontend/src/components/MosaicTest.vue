<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMosaicStore } from '@/stores/mosaic'

const mosaicStore = useMosaicStore()
const testStatus = ref<string>('Not started')
const testResults = ref<any>(null)

const runTest = async () => {
  try {
    testStatus.value = 'Loading and analyzing image...'
    
    // Test with a reference photo from /public folder
    // You can use: test-photo.jpg, test-photo.png, grandpa.png, etc.
    const referencePhoto = '/grandpa.png'
    
    console.log('🧪 Starting mosaic analyzer test...')
    console.log('📸 Reference photo:', referencePhoto)
    
    // Initialize mosaic (this will analyze the photo)
    await mosaicStore.initializeConfig(referencePhoto, 1200) // ~1200 cards
    
    testStatus.value = 'Analysis complete!'
    
    // Get results
    testResults.value = {
      gridWidth: mosaicStore.gridWidth,
      gridHeight: mosaicStore.gridHeight,
      totalCards: mosaicStore.totalCards,
      sampleColors: mosaicStore.cardColors.slice(0, 10), // First 10 cards as sample
    }
    
    console.log('✅ Test Results:', testResults.value)
    console.log(`📊 Grid: ${mosaicStore.gridWidth}x${mosaicStore.gridHeight} = ${mosaicStore.totalCards} cards`)
    console.log('🎨 Sample colors (first 10):')
    testResults.value.sampleColors.forEach((card: any) => {
      console.log(
        `  Card [${card.position.row},${card.position.col}]: ${card.backgroundColor} (brightness: ${card.brightness})`
      )
    })
    
  } catch (error) {
    testStatus.value = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    console.error('❌ Test failed:', error)
  }
}

onMounted(() => {
  // Automatically run test when component mounts
  runTest()
})
</script>

<template>
  <div class="test-container">
    <h2>🧪 Mosaic Analyzer Test</h2>
    
    <div class="status">
      <strong>Status:</strong> {{ testStatus }}
    </div>
    
    <div v-if="testResults" class="results">
      <h3>Results:</h3>
      <ul>
        <li><strong>Grid Dimensions:</strong> {{ testResults.gridWidth }} × {{ testResults.gridHeight }}</li>
        <li><strong>Total Cards:</strong> {{ testResults.totalCards }}</li>
      </ul>
      
      <h4>Sample Cards (first 10):</h4>
      <div class="color-samples">
        <div 
          v-for="card in testResults.sampleColors" 
          :key="`${card.position.row}-${card.position.col}`"
          class="color-card"
          :style="{ backgroundColor: card.backgroundColor }"
        >
          <div class="card-info">
            <div>{{ card.position.row }},{{ card.position.col }}</div>
            <div>{{ card.backgroundColor }}</div>
            <div>B: {{ card.brightness }}</div>
          </div>
        </div>
      </div>
      
      <p class="note">✅ Check browser console for full details!</p>
    </div>
    
    <button @click="runTest" class="test-button">Run Test Again</button>
  </div>
</template>

<style scoped>
.test-container {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
  color: var(--color-text-primary);
}

h2 {
  margin-bottom: 1rem;
}

.status {
  padding: 1rem;
  background: var(--color-background-secondary);
  border-radius: 4px;
  margin: 1rem 0;
}

.results {
  margin: 2rem 0;
}

.results ul {
  list-style: none;
  padding: 0;
}

.results li {
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-border);
}

.color-samples {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.color-card {
  aspect-ratio: 1;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  display: flex;
  align-items: flex-end;
  padding: 0.5rem;
  position: relative;
  overflow: hidden;
}

.card-info {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.25rem;
  font-size: 0.7rem;
  border-radius: 2px;
  width: 100%;
}

.card-info div {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.test-button {
  padding: 0.75rem 1.5rem;
  background: var(--color-text-primary);
  color: var(--color-background);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 1rem;
}

.test-button:hover {
  opacity: 0.8;
}

.note {
  margin-top: 1rem;
  font-style: italic;
  color: var(--color-text-secondary);
}
</style>

