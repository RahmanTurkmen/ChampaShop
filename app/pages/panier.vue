<script setup lang="ts">
import { useCartStore } from '~/stores/cart'

const cart = useCartStore()

// Le cookie est lu côté serveur : les produits du panier sont chargés dès le rendu SSR
const { status, refresh } = await useAsyncData('cart-products', async () => {
  await cart.loadProducts()
  return true
})

useSeoMeta({
  title: 'Panier',
  robots: 'noindex',
})
</script>

<template>
  <div>
    <h1 class="page-title">Panier</h1>

    <p class="cart__notice" role="status" aria-live="polite">{{ cart.notice }}</p>

    <div v-if="cart.lines.length === 0" class="alert alert--info">
      <p>Votre panier est vide.</p>
      <NuxtLink to="/produits" class="btn">Découvrir le catalogue</NuxtLink>
    </div>

    <div v-else-if="status === 'error'" class="alert alert--error" role="alert">
      <p>Impossible de charger les produits du panier.</p>
      <button type="button" class="btn" @click="() => refresh()">Réessayer</button>
    </div>

    <div v-else class="cart">
      <section aria-labelledby="cart-lines-title">
        <h2 id="cart-lines-title" class="sr-only">Articles</h2>
        <ul class="cart__lines">
          <CartLineItem
            v-for="line in cart.displayLines"
            :key="line.product.id"
            :product="line.product"
            :quantity="line.quantity"
            @update-quantity="cart.setQuantity"
            @remove="cart.remove"
          />
        </ul>
        <button type="button" class="btn btn--secondary cart__clear" @click="cart.clear()">
          Vider le panier
        </button>
      </section>

      <CartSummaryPanel
        :summary="cart.summary"
        :promo-code="cart.promoCode"
        @apply-code="cart.applyPromoCode"
      />
    </div>
  </div>
</template>

<style scoped>
.cart {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
  gap: 24px;
  align-items: start;
}

.cart__lines {
  display: grid;
  gap: 12px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.cart__clear {
  margin-top: 16px;
}

.cart__notice {
  min-height: 1.5em;
}

@media (max-width: 900px) {
  .cart {
    grid-template-columns: 1fr;
  }
}
</style>
