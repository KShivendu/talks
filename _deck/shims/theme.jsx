import { useEffect, useState } from 'react'

/**
 * Stand-in for `next-themes`.
 *
 * The blog's charts read `{ theme, resolvedTheme }` to pick their palette.
 * Slidev drives dark mode by toggling `.dark` on <html>, so instead of holding
 * a second copy of the theme state we just watch that class. The charts then
 * follow the deck's own light/dark toggle for free, including mid-talk.
 */
function readTheme() {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState(readTheme)

  useEffect(() => {
    const root = document.documentElement
    const obs = new MutationObserver(() => setTheme(readTheme()))
    obs.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  return { theme, resolvedTheme: theme, setTheme: () => {}, systemTheme: theme }
}

// next-themes also exports a provider; nothing here needs it, but an import
// of it shouldn't explode.
export function ThemeProvider({ children }) {
  return children
}
