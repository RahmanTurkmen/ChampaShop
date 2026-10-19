<script setup lang="ts">
import type { Product } from '~/types/dummyjson'
import { useCompareStore } from '~/stores/compare'
import {
  canonicalCompareQuery,
  compareLink,
  compareQueryNeedsNormalization,
  parseCompareQuery,
  sameCompareSelection,
} from '~/utils/compare'
import { getHttpStatus } from '~/utils/http'

/** Résultat du chargement d'un produit de l'URL */
interface CompareSlot {
  id: number
  product: Product | null
  /** true si l'API répond 404 : le produit est retiré de l'URL */
  notFound: boolean
}

const route = useRoute()
const api = useProductsApi()
const compare = useCompareStore()

useSeoMeta({
  title: 'Comparer des produits',
  robots: 'noindex',
})

/** L'URL est la source de vérité : /comparer?ids=3,17,42 */
const requestedIds = computed<number[]>(() => parseCompareQuery(route.query.ids))

/**
 * Produits déjà chargés par cette page. Après une normalisation côté client (ex. :
 * ?ids=1,999 réécrit en ?ids=1), useAsyncData relance le chargement pour la nouvelle URL :
 * sans ce cache, le produit 1 serait redemandé à DummyJSON alors qu'on l'a déjà.
 * Simple Map non réactive : elle n'a pas besoin d'être transmise du serveur au client.
 */
const loaded = new Map<number, Product>()

/**
 * Chargement en parallèle (DummyJSON n'a pas d'appel multi-identifiants) avec
 * Promise.allSettled : l'échec d'un produit n'empêche pas l'affichage des autres.
 * Un produit inexistant (404) est marqué pour être retiré de l'URL ; une autre erreur
 * (réseau, 500) le garde dans l'URL avec un message, pour ne pas casser un lien partagé.
 * Une erreur n'est pas mise en cache : « Réessayer » redemande bien le produit.
 */
const { data: slots, refresh } = await useAsyncData<CompareSlot[]>(
  () => `compare:${requestedIds.value.join(',')}`,
  async (_nuxtApp, { signal }) => {
    const ids = requestedIds.value
    const results = await Promise.allSettled(
      ids.map((id) => loaded.get(id) ?? api.getProduct(id, signal)),
    )
    return results.map((result, index): CompareSlot => {
      const id = ids[index] ?? 0
      if (result.status === 'fulfilled') {
        loaded.set(id, result.value)
        return { id, product: result.value, notFound: false }
      }
      return { id, product: null, notFound: getHttpStatus(result.reason) === 404 }
    })
  },
  { default: () => [], watch: [requestedIds] },
)

// Après l'hydratation, le handler n'a pas tourné côté client : on remplit le cache avec
// les produits reçus du serveur.
for (const slot of slots.value) {
  if (slot.product) loaded.set(slot.id, slot.product)
}

/** Produits de l'URL qui existent (chargés ou en échec temporaire), dans l'ordre de l'URL */
const validIds = computed<number[]>(() =>
  slots.value.filter((slot) => !slot.notFound).map((slot) => slot.id),
)
const products = computed<Product[]>(() =>
  slots.value.flatMap((slot) => (slot.product ? [slot.product] : [])),
)
const failedIds = computed<number[]>(() =>
  slots.value.filter((slot) => !slot.product && !slot.notFound).map((slot) => slot.id),
)

/**
 * URL invalide (abc, doublon, au-delà de 3, produit inexistant) : on la réécrit sans
 * ajouter d'entrée dans l'historique. Côté serveur, navigateTo renvoie une redirection :
 * ça marche aussi sans JavaScript, et jamais d'erreur 500.
 */
async function normalizeUrl(): Promise<void> {
  if (!compareQueryNeedsNormalization(route.query.ids, validIds.value)) return
  const ids = canonicalCompareQuery(validIds.value)
  await navigateTo({ path: '/comparer', query: ids ? { ids } : {} }, { replace: true })
}

// Deux appels, pour deux moments différents :
// - ici, au premier rendu (serveur, ou client lors d'une navigation) : une URL invalide est
//   réécrite avant l'affichage, en redirection côté serveur (marche sans JavaScript) ;
// - via le watch, quand l'URL change ensuite sur la même page (lien interne, « Réessayer ») et
//   que le nouveau chargement révèle un produit inexistant à retirer.
await normalizeUrl()
watch(slots, normalizeUrl)

/**
 * Sélection du visiteur (cookie) différente du lien ouvert : on affiche le lien et on
 * propose de remplacer, sans jamais écraser la sélection sans son accord.
 */
const selectionDiffers = computed<boolean>(
  () => validIds.value.length > 0 && !sameCompareSelection(compare.ids, validIds.value),
)
const replaceMessage = ref<string>('')

/**
 * Après le remplacement, cookie et URL sont identiques : le bandeau, et donc le bouton qui
 * avait le focus, disparaît. On replace le focus sur le contenu (pattern de CompareBar.vue).
 */
async function replaceSelection(): Promise<void> {
  compare.replace(validIds.value)
  replaceMessage.value = 'Votre sélection a été remplacée par celle de ce lien.'
  await nextTick()
  document.getElementById('contenu')?.focus()
}

/** Copie du lien : Clipboard API si disponible, sinon champ texte sélectionné à copier à la main */
const { origin } = useRequestURL()
const shareUrl = computed<string>(() => `${origin}${compareLink(validIds.value)}`)
const copyMessage = ref<string>('')
const showFallback = ref<boolean>(false)
const fallbackInput = ref<HTMLInputElement | null>(null)

async function copyLink(): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(shareUrl.value)
      showFallback.value = false
      copyMessage.value = 'Lien copié dans le presse-papiers.'
      return
    } catch {
      // Permission refusée ou page non sécurisée (http) : on passe à la solution de repli
    }
  }
  showFallback.value = true
  copyMessage.value = 'Copie automatique impossible : le lien est sélectionné, copiez-le avec Ctrl+C.'
  await nextTick()
  fallbackInput.value?.focus()
  fallbackInput.value?.select()
}
</script>

<template>
  <div class="compare-page">
    <h1>Comparer des produits</h1>

    <div v-if="selectionDiffers" class="compare-page__banner card" role="region" aria-label="Sélection différente">
      <p v-if="compare.count > 0">
        Ce lien ne contient pas les mêmes produits que votre sélection ({{ compare.count }} produit{{ compare.count > 1 ? 's' : '' }}).
        <NuxtLink :to="compareLink(compare.ids)">Voir ma sélection</NuxtLink>
      </p>
      <p v-else>Ces produits ne font pas partie de votre sélection.</p>
      <button type="button" class="btn btn--secondary" @click="replaceSelection">
        Remplacer ma sélection par celle-ci
      </button>
    </div>
    <p class="sr-only" role="status" aria-live="polite">{{ replaceMessage }}</p>

    <template v-if="validIds.length > 0">
      <div class="compare-page__share">
        <button type="button" class="btn" @click="copyLink">Copier le lien</button>
        <label v-if="showFallback" class="compare-page__fallback">
          <span>Lien à copier</span>
          <input ref="fallbackInput" type="text" readonly :value="shareUrl" class="input" >
        </label>
        <p class="compare-page__copy-message" role="status" aria-live="polite">{{ copyMessage }}</p>
      </div>

      <p v-if="failedIds.length > 0" class="compare-page__error" role="alert">
        Impossible de charger
        {{ failedIds.length > 1 ? 'les produits' : 'le produit' }} n° {{ failedIds.join(', ') }}.
        <button type="button" class="btn btn--secondary" @click="refresh()">Réessayer</button>
      </p>

      <!-- Tableau comparatif : branche D (#22). En attendant, les produits sous forme de cartes. -->
      <ul class="compare-page__list">
        <li v-for="product in products" :key="product.id">
          <ProductCard :product="product" />
        </li>
      </ul>
    </template>

    <div v-else class="compare-page__empty">
      <p>Aucun produit à comparer.</p>
      <p>
        <NuxtLink v-if="compare.count > 0" :to="compareLink(compare.ids)" class="btn">
          Voir ma sélection ({{ compare.count }})
        </NuxtLink>
        <NuxtLink v-else to="/produits" class="btn">Parcourir le catalogue</NuxtLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.compare-page__banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.compare-page__banner p {
  margin: 0;
}

.compare-page__share {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.compare-page__fallback {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1 1 280px;
}

.compare-page__fallback .input {
  width: 100%;
}

.compare-page__copy-message {
  margin: 0;
  min-height: 1.5em;
}

.compare-page__error {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  color: var(--color-danger);
}

.compare-page__list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.compare-page__empty {
  padding: 32px 0;
}
</style>
