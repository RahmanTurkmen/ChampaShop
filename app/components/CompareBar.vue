<script setup lang="ts">
import type { CompareThumbnail } from '~/types/dummyjson'
import { useCompareStore } from '~/stores/compare'
import { MAX_COMPARE, compareLink } from '~/utils/compare'

interface CompareBarItem {
  id: number
  /** null si le produit n'a pas pu être chargé : on garde quand même le bouton de retrait */
  product: CompareThumbnail | null
}

const compare = useCompareStore()
const api = useProductsApi()
const { ids } = storeToRefs(compare)

const link = ref<{ $el: HTMLElement } | null>(null)

/**
 * Miniatures et titres : un appel léger par produit (/products/{id}?select=title,thumbnail),
 * en parallèle. DummyJSON n'a pas d'appel multi-identifiants. Promise.allSettled : l'échec
 * d'un produit n'empêche pas l'affichage des autres (il reste affiché avec son numéro).
 * Le cache (useState, transmis du serveur au client) évite de redemander les produits déjà
 * chargés quand la sélection change.
 */
const thumbnails = useState<Record<number, CompareThumbnail>>('compare-thumbnails', () => ({}))

useAsyncData<number>(
  'compare-bar',
  async (_nuxtApp, { signal }) => {
    const missing = ids.value.filter((id) => !thumbnails.value[id])
    const results = await Promise.allSettled(missing.map((id) => api.getCompareThumbnail(id, signal)))

    const next = { ...thumbnails.value }
    for (const result of results) {
      if (result.status === 'fulfilled') next[result.value.id] = result.value
    }
    thumbnails.value = next
    // Nombre de produits chargés (useAsyncData ne doit pas renvoyer undefined)
    return results.filter((result) => result.status === 'fulfilled').length
  },
  { watch: [ids] },
)

const items = computed<CompareBarItem[]>(() =>
  ids.value.map((id) => ({ id, product: thumbnails.value[id] ?? null })),
)

function titleOf(item: CompareBarItem): string {
  return item.product?.title ?? `Produit n° ${item.id}`
}

/** Après un retrait, le bouton cliqué disparaît : on replace le focus pour ne pas le perdre. */
async function removeItem(id: number): Promise<void> {
  compare.remove(id)
  await nextTick()
  if (compare.count > 0) {
    link.value?.$el.focus()
  } else {
    document.getElementById('contenu')?.focus()
  }
}
</script>

<template>
  <div class="compare-dock">
    <!-- Zone toujours présente dans le DOM : une zone aria-live ajoutée en même temps
         que son texte n'est pas annoncée de façon fiable. -->
    <p
      :class="['compare-dock__message', { 'sr-only': compare.count === 0 }]"
      role="status"
      aria-live="polite"
    >
      {{ compare.message }}
    </p>

    <section v-if="compare.count > 0" class="compare-bar" aria-label="Comparateur de produits">
      <div class="container compare-bar__inner">
        <ul class="compare-bar__list">
          <li v-for="item in items" :key="item.id" class="compare-bar__item">
            <img
              v-if="item.product"
              :src="item.product.thumbnail"
              alt=""
              width="48"
              height="48"
              class="compare-bar__thumb"
            >
            <span v-else class="compare-bar__thumb compare-bar__thumb--empty" aria-hidden="true" />
            <span class="compare-bar__title">{{ titleOf(item) }}</span>
            <button
              type="button"
              class="compare-bar__remove"
              :aria-label="`Retirer « ${titleOf(item)} » du comparateur`"
              @click="removeItem(item.id)"
            >
              <span aria-hidden="true">×</span>
            </button>
          </li>
        </ul>

        <NuxtLink ref="link" :to="compareLink(compare.ids)" class="btn compare-bar__link">
          Comparer ({{ compare.count }}/{{ MAX_COMPARE }})
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.compare-dock {
  position: sticky;
  bottom: 0;
  z-index: 5;
}

.compare-dock__message:not(.sr-only) {
  margin: 0;
  padding: 0 16px;
  text-align: center;
  font-weight: 600;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
}

.compare-dock__message:empty {
  border-top: 0;
}

.compare-bar {
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  box-shadow: 0 -4px 12px rgb(15 23 42 / 0.12);
  padding: 8px 0;
}

.compare-bar__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.compare-bar__list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.compare-bar__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 2px 2px 4px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface-muted);
}

.compare-bar__thumb {
  width: 48px;
  height: 48px;
  object-fit: contain;
  border-radius: 6px;
  background: var(--color-surface);
}

.compare-bar__thumb--empty {
  display: block;
}

.compare-bar__title {
  max-width: 14ch;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.9rem;
}

.compare-bar__remove {
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: var(--radius);
  background: transparent;
  color: var(--color-text);
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
}

.compare-bar__remove:hover {
  background: var(--color-surface);
  color: var(--color-danger);
}

@media (max-width: 640px) {
  .compare-bar__title {
    display: none;
  }

  .compare-bar__link {
    width: 100%;
  }
}
</style>
