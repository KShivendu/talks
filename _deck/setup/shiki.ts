/*
 * Reproduce the Marp deck's code-block colours in Slidev.
 *
 * Marp shipped highlight.js's "Sunburst" theme. Every colour below was read
 * straight out of the built Marp deck (token-storage/index.html), so the two
 * decks highlight identically:
 *
 *   .hljs            background #000     foreground #f8f8f8
 *   .hljs-quote      #aeaeae     comments
 *   .hljs-string     #65b042     strings
 *   .hljs-symbol     #3387cc     numbers / symbols
 *   .hljs-type       #e28964     keywords / storage types
 *   .hljs-title      #89bdff     function names
 *   .hljs-variable   #3e87e3
 *   .hljs-attribute  #cda869
 *   .hljs-regexp     #e9c062
 *   .hljs-subst      #daefa3
 *   .hljs-meta       #8996a8
 *
 * Shiki has no Sunburst built in, but it accepts a TextMate theme object, so
 * we map those hljs classes onto the equivalent TextMate scopes.
 */
const sunburst = {
  name: 'marp-sunburst',
  type: 'dark' as const,
  colors: {
    // Measured off the rendered Marp slide, not off its stylesheet: the .hljs
    // rule says #000, but Marp's gaia theme repaints the block with the deck's
    // --color-foreground. Sampling the pixels gives #182b3a on #ffffff.
    'editor.background': '#182b3a',
    'editor.foreground': '#ffffff',
  },
  settings: [
    { settings: { background: '#182b3a', foreground: '#ffffff' } },
    {
      scope: ['comment', 'punctuation.definition.comment', 'string.quoted.docstring'],
      settings: { foreground: '#aeaeae', fontStyle: 'italic' },
    },
    {
      scope: ['string', 'string.quoted', 'punctuation.definition.string'],
      settings: { foreground: '#65b042' },
    },
    {
      scope: ['constant.numeric', 'constant.language', 'constant.character', 'support.constant'],
      settings: { foreground: '#3387cc' },
    },
    {
      scope: ['keyword', 'storage', 'storage.type', 'storage.modifier', 'keyword.control'],
      settings: { foreground: '#e28964' },
    },
    {
      scope: ['entity.name.function', 'support.function', 'meta.function-call', 'entity.name.class'],
      settings: { foreground: '#89bdff' },
    },
    { scope: ['variable', 'variable.other', 'meta.definition.variable'], settings: { foreground: '#3e87e3' } },
    { scope: ['variable.parameter', 'meta.parameter'], settings: { foreground: '#daefa3' } },
    { scope: ['entity.other.attribute-name', 'support.type.property-name'], settings: { foreground: '#cda869' } },
    { scope: ['string.regexp', 'constant.character.escape'], settings: { foreground: '#e9c062' } },
    { scope: ['meta.preprocessor', 'punctuation.definition.annotation'], settings: { foreground: '#8996a8' } },
    { scope: ['entity.name.tag'], settings: { foreground: '#89bdff' } },
    { scope: ['keyword.operator', 'punctuation'], settings: { foreground: '#ffffff' } },
  ],
}

export default () => ({
  // same theme in light and dark: the block is always a dark card, exactly as
  // it was in Marp
  themes: { light: sunburst, dark: sunburst },
})
