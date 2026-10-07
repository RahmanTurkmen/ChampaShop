<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { getHttpStatus } from '~/utils/http'
import { safeRedirectPath } from '~/utils/redirect'

const auth = useAuthStore()
const route = useRoute()

const username = ref<string>('')
const password = ref<string>('')
const errorMessage = ref<string | null>(null)
const submitting = ref<boolean>(false)

const redirectTo = computed<string>(() => safeRedirectPath(route.query.redirect))

// Déjà connecté : inutile d'afficher le formulaire
if (auth.isLoggedIn) {
  await navigateTo(redirectTo.value, { replace: true })
}

async function onSubmit(): Promise<void> {
  errorMessage.value = null
  submitting.value = true
  try {
    await auth.login(username.value.trim(), password.value)
    await navigateTo(redirectTo.value, { replace: true })
  } catch (error) {
    errorMessage.value =
      getHttpStatus(error) === 400
        ? 'Identifiant ou mot de passe incorrect.'
        : 'Connexion impossible pour le moment. Réessayez plus tard.'
  } finally {
    submitting.value = false
  }
}

useSeoMeta({
  title: 'Connexion',
  description: 'Connectez-vous à votre compte ChampaShop.',
  robots: 'noindex',
})
</script>

<template>
  <div class="login">
    <h1 class="page-title">Connexion</h1>

    <form class="login__form card" novalidate @submit.prevent="onSubmit">
      <div v-if="errorMessage" class="alert alert--error" role="alert">{{ errorMessage }}</div>

      <div class="field">
        <label for="login-username">Nom d'utilisateur</label>
        <input
          id="login-username"
          v-model="username"
          class="input"
          type="text"
          name="username"
          autocomplete="username"
          required
        >
      </div>

      <div class="field">
        <label for="login-password">Mot de passe</label>
        <input
          id="login-password"
          v-model="password"
          class="input"
          type="password"
          name="password"
          autocomplete="current-password"
          required
        >
      </div>

      <button type="submit" class="btn" :disabled="submitting || !username || !password">
        {{ submitting ? 'Connexion…' : 'Se connecter' }}
      </button>

      <p class="muted login__demo">
        Compte de démonstration : <code>emilys</code> / <code>emilyspass</code>
      </p>
    </form>
  </div>
</template>

<style scoped>
.login {
  max-width: 420px;
  margin: 0 auto;
}

.login__form {
  display: grid;
  gap: 16px;
  padding: 24px;
}

.login__demo {
  margin: 0;
  font-size: 0.9rem;
}
</style>
