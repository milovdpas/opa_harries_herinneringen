<script setup lang="ts">
// Test view for analyzing reference photos
import MosaicTest from '@/components/MosaicTest.vue'
</script>

<template>
  <main>
    <h1>🧪 Mosaic Analyzer Test</h1>
    <p class="subtitle">Use this page to test different reference photos and check dimensions</p>
    <MosaicTest />
    <div class="nav-link">
      <router-link to="/">← Back to Mosaic</router-link>
    </div>
  </main>
</template>

<style scoped>
main {
  min-height: 100vh;
  padding: 2rem;
}

h1 {
  text-align: center;
  margin-bottom: 0.5rem;
}

.subtitle {
  text-align: center;
  color: var(--color-text-secondary);
  margin-bottom: 2rem;
}

.nav-link {
  text-align: center;
  margin-top: 2rem;
}

.nav-link a {
  color: var(--color-text-primary);
  text-decoration: none;
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  display: inline-block;
}

.nav-link a:hover {
  background: var(--color-background-secondary);
}
</style>

