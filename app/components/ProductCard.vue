<script setup lang="ts">
import type { ProductSummary } from '~/types/dummyjson'
import { formatPrice } from '~/utils/money'
import { discountBadge } from '~/utils/stock'

const props = defineProps<{ product: ProductSummary }>()

const badge = computed<string | null>(() => discountBadge(props.product.discountPercentage))
</script>

<template>
  <article class="product card">
    <NuxtLink :to="`/produits/${product.id}`" class="product__link">
      <div class="product__image">
        <img :src="product.thumbnail" :alt="product.title" loading="lazy" width="300" height="300" >
        <span v-if="badge" class="product__badge">
          <span class="sr-only">Remise de </span>{{ badge }}
        </span>
      </div>
      <h2 class="product__title">{{ product.title }}</h2>
    </NuxtLink>
    <div class="product__meta">
      <RatingStars :rating="product.rating" />
      <p class="product__price">{{ formatPrice(product.price) }}</p>
    </div>
  </article>
</template>

<style scoped>
.product {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.product__link {
  color: inherit;
  text-decoration: none;
  flex: 1;
}

.product__link:hover .product__title {
  text-decoration: underline;
}

.product__image {
  position: relative;
  aspect-ratio: 1;
  background: var(--color-surface-muted);
}

.product__image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.product__badge {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--color-badge);
  color: #fff;
  font-weight: 700;
  font-size: 0.85rem;
}

.product__title {
  margin: 12px 12px 4px;
  font-size: 1rem;
}

.product__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 0 12px 12px;
}

.product__price {
  margin: 0;
  font-weight: 700;
  font-size: 1.1rem;
}
</style>
