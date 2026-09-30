<script setup lang="ts">
useSeoMeta({
  title: 'Accueil',
  description:
    'ChampaShop, la boutique en ligne rapide et accessible : beauté, high-tech, maison, épicerie…',
  ogTitle: 'ChampaShop',
  ogDescription: 'La boutique en ligne rapide et accessible.',
  ogType: 'website',
})

const highlights = [
  { title: 'Beauté', text: '−10 % dès 3 articles beauté achetés.', to: '/produits?category=beauty' },
  { title: 'Code TROYES10', text: '−10,00 € dès 50,00 € d’achat.', to: '/produits' },
  { title: 'Livraison offerte', text: 'Dès 80,00 € d’achat (hors mobilier).', to: '/produits' },
]
</script>

<template>
  <div>
    <section class="hero">
      <h1>Bienvenue chez ChampaShop</h1>
      <p class="muted">Des milliers de sourires, quelques centaines de produits.</p>
      <NuxtLink to="/produits" class="btn">Voir le catalogue</NuxtLink>
    </section>

    <section aria-labelledby="offers-title">
      <h2 id="offers-title">Nos offres</h2>
      <ul class="offers">
        <li v-for="item in highlights" :key="item.title" class="card offer">
          <h3>{{ item.title }}</h3>
          <p>{{ item.text }}</p>
          <NuxtLink :to="item.to">En profiter<span class="sr-only"> : {{ item.title }}</span></NuxtLink>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.hero {
  padding: 56px 0 40px;
  text-align: center;
}

.hero h1 {
  font-size: clamp(2rem, 5vw, 3rem);
  margin: 0 0 8px;
}

.offers {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  list-style: none;
  padding: 0;
}

.offer {
  padding: 20px;
}

.offer h3 {
  margin-top: 0;
}
</style>
