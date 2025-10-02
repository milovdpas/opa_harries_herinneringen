<script setup lang="ts">
import { ref } from 'vue'
import { calculateGridDimensions, analyzeReferencePhoto } from '@/utils/photoAnalyzer'
import type { CardColorData } from '@/types'

const imageUrl = ref('/grandpa.png')
const targetCards = ref(6000)
const isGenerating = ref(false)
const generatedConfig = ref('')
const gridInfo = ref<{ width: number; height: number; total: number } | null>(null)

const generateConfig = async () => {
  isGenerating.value = true
  generatedConfig.value = ''
  gridInfo.value = null

  try {
    console.log('🎨 Generating mosaic config...')

    // Calculate grid dimensions
    const { gridWidth, gridHeight } = await calculateGridDimensions(imageUrl.value, targetCards.value)
    
    // Analyze photo and get colors
    const cardColors = await analyzeReferencePhoto(imageUrl.value, gridWidth, gridHeight)

    gridInfo.value = {
      width: gridWidth,
      height: gridHeight,
      total: cardColors.length,
    }

    // Generate TypeScript code
    const configCode = generateConfigCode(imageUrl.value, gridWidth, gridHeight, cardColors)
    generatedConfig.value = configCode

    console.log('✅ Config generated successfully!')
  } catch (error) {
    console.error('❌ Error generating config:', error)
    alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  } finally {
    isGenerating.value = false
  }
}

const generateConfigCode = (
  photoUrl: string,
  gridWidth: number,
  gridHeight: number,
  cardColors: CardColorData[],
): string => {
  // Format card colors as TypeScript array
  const colorsCode = cardColors
    .map((card) => {
      const alpha = card.alpha !== undefined ? `, alpha: ${card.alpha.toFixed(2)}` : ''
      return `    { position: { row: ${card.position.row}, col: ${card.position.col} }, backgroundColor: '${card.backgroundColor}', brightness: ${card.brightness}${alpha} },`
    })
    .join('\n')

  return `import type { CardColorData } from '@/types'

export const MOSAIC_CONFIG = {
  referencePhotoUrl: '${photoUrl}',
  gridWidth: ${gridWidth},
  gridHeight: ${gridHeight},
  cardColors: [
${colorsCode}
  ] as CardColorData[],
  lastUpdated: new Date('${new Date().toISOString()}'),
}`
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(generatedConfig.value)
    alert('✅ Config copied to clipboard!')
  } catch (error) {
    console.error('Failed to copy:', error)
    alert('❌ Failed to copy. Please manually select and copy the code.')
  }
}
</script>

<template>
  <div class="generator-container">
    <header class="header">
      <h1>🎨 Mosaic Config Generator</h1>
      <p class="subtitle">Generate pre-calculated mosaic configuration for optimal performance</p>
      <router-link to="/" class="back-link">← Back to Home</router-link>
    </header>

    <div class="generator-form">
      <div class="form-group">
        <label for="imageUrl">Reference Photo Path:</label>
        <input
          id="imageUrl"
          v-model="imageUrl"
          type="text"
          placeholder="/grandpa.png"
        />
        <small>Path relative to /public folder</small>
      </div>

      <div class="form-group">
        <label for="targetCards">Target Cards (Detail Level):</label>
        <input
          id="targetCards"
          v-model.number="targetCards"
          type="number"
          min="1000"
          max="20000"
          step="100"
        />
        <small>Higher = more detail, but larger config file (recommended: 6000)</small>
      </div>

      <button
        @click="generateConfig"
        :disabled="isGenerating"
        class="generate-btn"
      >
        {{ isGenerating ? 'Generating...' : '🎨 Generate Config' }}
      </button>
    </div>

    <div v-if="gridInfo" class="grid-info">
      <h3>Grid Dimensions:</h3>
      <p>{{ gridInfo.width }}×{{ gridInfo.height }} = {{ gridInfo.total }} cards</p>
    </div>

    <div v-if="generatedConfig" class="output">
      <div class="output-header">
        <h3>Generated Configuration:</h3>
        <button @click="copyToClipboard" class="copy-btn">
          📋 Copy to Clipboard
        </button>
      </div>

      <div class="instructions">
        <h4>How to use:</h4>
        <ol>
          <li>Click "Copy to Clipboard" above</li>
          <li>Open <code>src/config/mosaicConfig.ts</code></li>
          <li>Replace the entire file content with the copied code</li>
          <li>Reload the home page - it will load instantly!</li>
        </ol>
      </div>

      <pre class="code-output">{{ generatedConfig }}</pre>
    </div>
  </div>
</template>

<style scoped>
.generator-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  color: var(--color-text-primary);
}

.header {
  text-align: center;
  margin-bottom: 3rem;
}

h1 {
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--color-text-secondary);
  margin-bottom: 1rem;
}

.back-link {
  display: inline-block;
  margin-top: 1rem;
  color: var(--color-text-secondary);
  text-decoration: none;
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
}

.back-link:hover {
  background: var(--color-background-secondary);
}

.generator-form {
  background: var(--color-background-secondary);
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  background: var(--color-background);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 1rem;
}

.form-group small {
  display: block;
  color: var(--color-text-secondary);
  margin-top: 0.25rem;
  font-size: 0.85rem;
}

.generate-btn {
  width: 100%;
  padding: 1rem;
  background: var(--color-text-primary);
  color: var(--color-background);
  border: none;
  border-radius: 4px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.generate-btn:hover:not(:disabled) {
  opacity: 0.8;
}

.generate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.grid-info {
  background: var(--color-background-secondary);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  text-align: center;
}

.grid-info h3 {
  margin-bottom: 0.5rem;
}

.output {
  margin-top: 2rem;
}

.output-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.copy-btn {
  padding: 0.5rem 1rem;
  background: var(--color-text-primary);
  color: var(--color-background);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.copy-btn:hover {
  opacity: 0.8;
}

.instructions {
  background: rgba(100, 200, 100, 0.1);
  border: 1px solid rgba(100, 200, 100, 0.3);
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.instructions h4 {
  margin-bottom: 0.5rem;
}

.instructions ol {
  margin-left: 1.5rem;
}

.instructions li {
  margin: 0.5rem 0;
}

.instructions code {
  background: rgba(0, 0, 0, 0.3);
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: monospace;
}

.code-output {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 1.5rem;
  border-radius: 8px;
  overflow-x: auto;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  line-height: 1.5;
  max-height: 600px;
  overflow-y: auto;
}
</style>

