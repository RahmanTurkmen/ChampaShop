<script setup lang="ts">
import { useCartStore } from '~/stores/cart'
import { getHttpStatus } from '~/utils/http'
import { formatPrice } from '~/utils/money'
import { discountBadge, stockStatus, type StockStatus } from '~/utils/stock'

const route = useRoute()
const api = useProductsApi()
const cart = useCartStore()
const { siteUrl } = useRuntimeConfig().public

const productId = Number(route.params.id)

// Identifiant non numérique : vraie 404 sans même appeler l'API
if (!Number.isInteger(productId) || productId <= 0) {
  throw createError({ statusCode: 404, statusMessage: 'Produit introuvable', fatal: true })
}

const { data: product, error } = await useAsyncData(`product:${productId}`, (_nuxtApp, { signal }) =>
  api.getProduct(productId, signal),
)

// Identifiant inexistant (l'API répond 404) : on renvoie une vraie page 404, pas une page vide
if (error.value || !product.value) {
  const status = getHttpStatus(error.value) ?? 500
  throw createError({
    statusCode: status === 404 ? 404 : 500,
    statusMessage: status === 404 ? 'Produit introuvable' : 'Impossible de charger le produit',
    fatal: true,
  })
}

const stock = computed<StockStatus>(() => stockStatus(product.value?.stock ?? 0))
const badge = computed<string | null>(() => discountBadge(product.value?.discountPercentage ?? 0))
const inCart = computed<number>(() => cart.quantityOf(productId))
const canAddMore = computed<boolean>(() => stock.value.available && inCart.value < (product.value?.stock ?? 0))
const addMessage = ref<string | null>(null)

function addToCart(): void {
  const current = product.value
  if (!current) return
  cart.add(current)
  addMessage.value = cart.notice
}

useSeoMeta({
  title: () => product.value?.title ?? 'Produit',
  description: () => product.value?.description ?? '',
  ogTitle: () => product.value?.title ?? '',
  ogDescription: () => product.value?.description ?? '',
  ogImage: () => product.value?.thumbnail ?? '',
  ogImageAlt: () => product.value?.title ?? '',
  ogType: 'website',
  ogUrl: () => `${siteUrl}/produits/${productId}`,
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <div v-if="product">
    <nav aria-label="Fil d'Ariane" class="breadcrumb">
      <NuxtLink to="/produits">Catalogue</NuxtLink>
      <span aria-hidden="true"> / </span>
      <NuxtLink :to="{ path: '/produits', query: { category: product.category } }">
        {{ product.category }}
      </NuxtLink>
    </nav>

    <article class="product">
      <ProductGallery :images="product.images" :title="product.title" />

      <div class="product__info">
        <p v-if="product.brand" class="product__brand muted">{{ product.brand }}</p>
        <h1 class="product__title">{{ product.title }}</h1>
        <RatingStars :rating="product.rating" />

        <p class="product__price">
          {{ formatPrice(product.price) }}
          <span v-if="badge" class="product__badge">{{ badge }}</span>
        </p>

        <p :class="['product__stock', `product__stock--${stock.level}`]">{{ stock.label }}</p>

        <div class="product__buy">
          <button type="button" class="btn" :disabled="!canAddMore" @click="addToCart">
            {{ stock.available ? 'Ajouter au panier' : 'Rupture de stock' }}
          </button>
          <NuxtLink v-if="inCart > 0" to="/panier" class="btn btn--secondary">
            Voir le panier ({{ inCart }})
          </NuxtLink>
        </div>
        <p v-if="stock.available && !canAddMore" class="muted">
          Vous avez déjà tout le stock disponible dans votre panier.
        </p>
        <p class="product__notice" role="status" aria-live="polite">{{ addMessage }}</p>

        <h2>Description</h2>
        <p>{{ product.description }}</p>

        <dl class="product__details">
          <div>
            <dt>Marque</dt>
            <dd>{{ product.brand ?? 'Non renseignée' }}</dd>
          </div>
          <div>
            <dt>Stock</dt>
            <dd>{{ product.stock }} unité{{ product.stock > 1 ? 's' : '' }}</dd>
          </div>
          <div>
            <dt>Garantie</dt>
            <dd>{{ product.warrantyInformation }}</dd>
          </div>
          <div>
            <dt>Livraison</dt>
            <dd>{{ product.shippingInformation }}</dd>
          </div>
          <div>
            <dt>Retours</dt>
            <dd>{{ product.returnPolicy }}</dd>
          </div>
        </dl>
      </div>
    </article>

    <section v-if="product.reviews.length > 0" class="reviews" aria-labelledby="reviews-title">
      <h2 id="reviews-title">Avis clients</h2>
      <ul>
        <li v-for="review in product.reviews" :key="`${review.reviewerEmail}-${review.date}`" class="card review">
          <RatingStars :rating="review.rating" />
          <p>{{ review.comment }}</p>
          <p class="muted">{{ review.reviewerName }}</p>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.breadcrumb {
  margin: 16px 0;
  text-transform: capitalize;
}

.product {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 32px;
}

.product__brand {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.85rem;
}

.product__title {
  margin: 4px 0 8px;
}

.product__price {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.8rem;
  font-weight: 800;
  margin: 16px 0 8px;
}

.product__badge {
  padding: 2px 10px;
  border-radius: 999px;
  background: var(--color-badge);
  color: #fff;
  font-size: 1rem;
}

.product__stock {
  font-weight: 600;
}

.product__stock--ok {
  color: var(--color-success);
}

.product__stock--low {
  color: var(--color-warning);
}

.product__stock--out {
  color: var(--color-danger);
}

.product__buy {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.product__notice {
  min-height: 1.5em;
}

.product__details {
  display: grid;
  gap: 8px;
  margin: 0;
}

.product__details div {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 8px;
}

.product__details dt {
  font-weight: 600;
}

.product__details dd {
  margin: 0;
}

.reviews ul {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  list-style: none;
  padding: 0;
}

.review {
  padding: 16px;
}
</style>
