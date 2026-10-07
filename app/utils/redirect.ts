/**
 * Sécurise le paramètre `?redirect=` de la page de connexion.
 * On n'accepte qu'un chemin interne (« /compte ») pour éviter les redirections
 * vers un site externe (« //evil.com », « https://… »).
 */
export function safeRedirectPath(value: unknown, fallback = '/compte'): string {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string') return fallback
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) return fallback
  return raw
}
