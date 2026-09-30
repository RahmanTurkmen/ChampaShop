<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const isNotFound = computed<boolean>(() => props.error.statusCode === 404)

useSeoMeta({
  title: isNotFound.value ? 'Page introuvable' : 'Erreur',
  robots: 'noindex',
})

function goHome(): Promise<void> {
  return clearError({ redirect: '/' })
}
</script>

<template>
  <NuxtLayout>
    <section class="error">
      <p class="error__code">{{ error.statusCode }}</p>
      <h1>{{ isNotFound ? 'Page introuvable' : 'Une erreur est survenue' }}</h1>
      <p class="muted">
        {{ isNotFound ? "Cette page ou ce produit n'existe pas." : error.statusMessage }}
      </p>
      <div class="error__actions">
        <button type="button" class="btn" @click="goHome">Retour à l'accueil</button>
        <NuxtLink to="/produits" class="btn btn--secondary">Voir le catalogue</NuxtLink>
      </div>
    </section>
  </NuxtLayout>
</template>

<style scoped>
.error {
  text-align: center;
  padding: 64px 0;
}

.error__code {
  font-size: 4rem;
  font-weight: 800;
  margin: 0;
  color: var(--color-primary);
}

.error__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}
</style>
