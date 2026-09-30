<template>
  <div class="layout">
    <a class="skip-link" href="#contenu">Aller au contenu</a>

    <header class="header">
      <div class="container header__inner">
        <NuxtLink to="/" class="logo">Champa<span>Shop</span></NuxtLink>

        <nav aria-label="Navigation principale">
          <ul class="nav">
            <li><NuxtLink to="/produits">Catalogue</NuxtLink></li>
          </ul>
        </nav>
      </div>
    </header>

    <main id="contenu" class="container main" tabindex="-1">
      <slot />
    </main>

    <footer class="footer">
      <div class="container">
        <p class="muted">
          ChampaShop, boutique fictive. Données :
          <a href="https://dummyjson.com" rel="noopener">DummyJSON</a>.
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.skip-link {
  position: absolute;
  left: 16px;
  top: -60px;
  z-index: 10;
  padding: 10px 16px;
  background: var(--color-primary);
  color: var(--color-on-primary);
  border-radius: var(--radius);
}

.skip-link:focus {
  top: 12px;
}

.header {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 64px;
  flex-wrap: wrap;
}

.logo {
  font-size: 1.4rem;
  font-weight: 800;
  text-decoration: none;
  color: var(--color-text);
}

.logo span {
  color: var(--color-primary);
}

.nav {
  display: flex;
  gap: 8px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 12px;
  border-radius: var(--radius);
  color: var(--color-text);
  text-decoration: none;
  font-weight: 600;
}

.nav a:hover,
.nav a.router-link-active {
  background: var(--color-surface-muted);
}

.nav__badge {
  min-width: 22px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-size: 0.8rem;
  text-align: center;
}

.main {
  flex: 1;
  padding-bottom: 48px;
}

.main:focus {
  outline: none;
}

.footer {
  border-top: 1px solid var(--color-border);
  padding: 16px 0;
  font-size: 0.9rem;
}
</style>
