/*
 * Qdrant chrome for the blog chart components.
 *
 * `chartChrome()` in the blog is green, because the blog is green -- it drives
 * the active view/dataset toggle pill. The components take a `chrome` prop that
 * shallow-merges over it, so the talk retints just those keys instead of
 * forking BarChart/LineChart.
 *
 * Amaranth reads on both grounds and white text clears AA on it (4.7:1), so one
 * value serves light and dark.
 */
export const qdrantChrome = { accent: '#dc244c', accentInk: '#ffffff' }
