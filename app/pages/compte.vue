<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import type { User } from '~/types/dummyjson'

definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Mon compte',
  robots: 'noindex',
})

const auth = useAuthStore()

/** Outil de démo réservé au développement (retiré du build de production). */
const isDev = import.meta.dev

const testing = ref<boolean>(false)
const testResult = ref<string | null>(null)

/**
 * Démonstration du rafraîchissement « single-flight » :
 * 3 requêtes authentifiées partent en même temps. Si le token a expiré
 * (se connecter avec NUXT_PUBLIC_AUTH_EXPIRES_IN_MINS=1 et attendre 1 minute),
 * les 3 reçoivent une 401 mais un seul POST /auth/refresh est envoyé.
 */
async function testParallelRequests(): Promise<void> {
  testing.value = true
  testResult.value = null
  const before = auth.refreshCount
  try {
    await Promise.all([
      auth.authFetch<User>('/auth/me'),
      auth.authFetch<User>('/auth/me'),
      auth.authFetch<User>('/auth/me'),
    ])
    const refreshes = auth.refreshCount - before
    testResult.value = `3 requêtes réussies, ${refreshes} appel${refreshes > 1 ? 's' : ''} à /auth/refresh.`
  } catch {
    testResult.value = 'Session expirée : veuillez vous reconnecter.'
  } finally {
    testing.value = false
  }
}
</script>

<template>
  <div v-if="auth.user" class="account">
    <h1 class="page-title">Mon compte</h1>

    <section class="account__card card">
      <img :src="auth.user.image" alt="" width="96" height="96" class="account__avatar" >
      <div>
        <h2>{{ auth.user.firstName }} {{ auth.user.lastName }}</h2>
        <p class="muted">@{{ auth.user.username }}</p>
        <p>{{ auth.user.email }}</p>
      </div>
    </section>

    <section class="account__section">
      <h2>Session</h2>
      <div class="account__actions">
        <button
          v-if="isDev"
          type="button"
          class="btn btn--secondary"
          :disabled="testing"
          @click="testParallelRequests"
        >
          Tester 3 requêtes simultanées
        </button>
        <button type="button" class="btn btn--danger" @click="auth.logout()">Se déconnecter</button>
      </div>
      <p role="status" aria-live="polite">{{ testResult }}</p>
    </section>
  </div>
</template>

<style scoped>
.account__card {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px;
}

.account__card h2 {
  margin: 0;
}

.account__avatar {
  border-radius: 50%;
  background: var(--color-surface-muted);
}

.account__section {
  margin-top: 32px;
}

.account__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
