/**
 * Sitemap dynamique (référencement) : pages publiques + une entrée par produit.
 */
interface ProductIdsResponse {
  products: { id: number }[]
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export default defineCachedEventHandler(
  async (event) => {
    const { apiBase, siteUrl } = useRuntimeConfig(event).public
    const staticPaths = ['/', '/produits']

    let productPaths: string[] = []
    try {
      const response = await $fetch<ProductIdsResponse>('/products', {
        baseURL: apiBase,
        query: { limit: 0, select: 'id' },
      })
      productPaths = response.products.map((product) => `/produits/${product.id}`)
    } catch {
      // API indisponible : on sert au moins les pages statiques
    }

    const urls = [...staticPaths, ...productPaths]
      .map((path) => `  <url><loc>${escapeXml(`${siteUrl}${path}`)}</loc></url>`)
      .join('\n')

    setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  },
  { maxAge: 60 * 60 },
)
