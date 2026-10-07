/**
 * Types des réponses de l'API DummyJSON (https://dummyjson.com/docs).
 * Écrits à partir des réponses réelles de /products, /products/categories et /auth.
 */

export interface Review {
  rating: number
  comment: string
  date: string
  reviewerName: string
  reviewerEmail: string
}

export interface Dimensions {
  width: number
  height: number
  depth: number
}

export interface ProductMeta {
  createdAt: string
  updatedAt: string
  barcode: string
  qrCode: string
}

export interface Product {
  id: number
  title: string
  description: string
  category: string
  price: number
  discountPercentage: number
  rating: number
  stock: number
  tags: string[]
  /** Absent pour certains produits (ex. : épicerie) */
  brand?: string
  sku: string
  weight: number
  dimensions: Dimensions
  warrantyInformation: string
  shippingInformation: string
  availabilityStatus: string
  reviews: Review[]
  returnPolicy: string
  minimumOrderQuantity: number
  meta: ProductMeta
  images: string[]
  thumbnail: string
}

/** Champs demandés via `select` pour les cartes du catalogue (payload réduit). */
export const PRODUCT_SUMMARY_FIELDS = [
  'title',
  'price',
  'rating',
  'discountPercentage',
  'thumbnail',
  'category',
  'stock',
] as const

export type ProductSummary = Pick<Product, 'id' | (typeof PRODUCT_SUMMARY_FIELDS)[number]>

/** Réponse paginée de /products, /products/search et /products/category/:slug */
export interface ProductsResponse<T = Product> {
  products: T[]
  total: number
  skip: number
  limit: number
}

/** Élément de GET /products/categories */
export interface Category {
  slug: string
  name: string
  url: string
}

/** Utilisateur renvoyé par GET /auth/me (champs utilisés par l'application) */
export interface User {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  gender: string
  image: string
  phone?: string
  age?: number
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

/** Réponse de POST /auth/login */
export type LoginResponse = Omit<User, 'phone' | 'age'> & AuthTokens

export interface LoginPayload {
  username: string
  password: string
  expiresInMins?: number
}
