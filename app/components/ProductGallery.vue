<script setup lang="ts">
const props = defineProps<{
  images: string[]
  title: string
}>()

const selectedIndex = ref<number>(0)
const selectedImage = computed<string>(() => props.images[selectedIndex.value] ?? props.images[0] ?? '')
</script>

<template>
  <div class="gallery">
    <div class="gallery__main card">
      <img :src="selectedImage" :alt="`${title}, image ${selectedIndex + 1} sur ${images.length}`" width="600" height="600" >
    </div>

    <ul v-if="images.length > 1" class="gallery__thumbs" aria-label="Choisir une image">
      <li v-for="(image, index) in images" :key="image">
        <button
          type="button"
          class="gallery__thumb"
          :aria-pressed="index === selectedIndex"
          :aria-label="`Afficher l'image ${index + 1}`"
          @click="selectedIndex = index"
        >
          <img :src="image" alt="" width="80" height="80" loading="lazy" >
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.gallery__main {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--color-surface-muted);
}

.gallery__main img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.gallery__thumbs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  list-style: none;
  padding: 0;
  margin: 12px 0 0;
}

.gallery__thumb {
  width: 72px;
  height: 72px;
  padding: 4px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  cursor: pointer;
}

.gallery__thumb[aria-pressed='true'] {
  border-color: var(--color-primary);
}

.gallery__thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
