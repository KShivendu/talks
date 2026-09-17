/*
 * Qdrant chrome for the blog chart components.
 *
 * Two things this fixes. The blog's accent is green, and it colours the active
 * view/dataset toggle. And the blog's dark ground is a green-tinted black
 * (card #0d1310, axis #38473e, border #1e2822) because the site is green --
 * next to Qdrant's Neon Blue and Amaranth that tint reads as a colour cast.
 * Qdrant Black #0B0F19 is a blue-black, so the neutrals are rebuilt around it.
 *
 * Mode matters: `chrome` shallow-merges over chartChrome(isDark) as one object,
 * so passing a dark `card` would darken the light theme too. Each chart runs in
 * its own iframe and mount.jsx reads ?dark from the URL, so that same flag
 * picks the variant here.
 */
const isDark = typeof location !== 'undefined' && new URLSearchParams(location.search).has('dark')

const ACCENT = '#dc244c' // Amaranth. 4.8:1 on white, 4.0:1 on #0B0F19.

export const qdrantChrome = isDark
  ? {
      card: '#0b0f19', // Qdrant Black, not the blog's #0d1310 green-black
      tip: '#0b0f19',
      ink: '#e8eaf0', // neutral, was #dde6e0 (green-tinted)
      muted: '#8b90a0', // was #8a968e
      grid: '#1b2030', // was #141922
      axis: '#394052', // was #38473e (green-tinted)
      border: '#232a3c', // was #1e2822
      accent: ACCENT,
      accentInk: '#ffffff',
    }
  : {
      axis: '#c9ccd4', // was #c8cfc9 (green-tinted)
      border: '#e1e3e8', // was #e0e4e1
      accent: ACCENT,
      accentInk: '#ffffff',
    }

/*
 * Same idea for the animated hero, whose colour roles are its own rather than
 * chartChrome's. Deck language: the token path is Amaranth, the byte/LZ4 path
 * is the recessive grey, so the hero says the same thing as every chart after
 * it. The site's green and amber would say something else entirely.
 */
export const qdrantHero = isDark
  ? {
      accent: ACCENT,
      accentInk: '#ffffff',
      bg: '#0b0f19',
      divider: '#232a3c',
      textMain: '#e8eaf0',
      textMuted: '#8b90a0',
      byteStroke: '#5d6573',
      byteText: '#8b90a0',
      tokFill: 'rgba(220,36,76,0.16)',
      tokText: '#ef5a7c',
      lz4Accent: '#8a9099',
      lz4Fill: 'rgba(138,144,153,0.14)',
    }
  : {
      accent: ACCENT,
      accentInk: '#ffffff',
      divider: '#e1e3e8',
      byteStroke: '#c9ccd4',
      tokFill: 'rgba(220,36,76,0.10)',
      tokText: '#a83865',
      lz4Accent: '#6c7480',
      lz4Fill: 'rgba(108,116,128,0.12)',
    }
