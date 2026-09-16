import { createElement, useEffect, useState } from 'react'

/**
 * Stand-in for `next/dynamic`.
 *
 * The blog uses it in exactly one place, to keep a chart off the server:
 *   const BarChart = dynamic(() => Promise.resolve(ChartImpl), { ssr: false })
 *
 * A deck has no server, so "disable SSR" is a no-op and all this has to do is
 * resolve the loader. React.lazy is the obvious choice but it insists the
 * promise resolve to `{ default }`, and the blog's loader resolves to the
 * component itself, so we accept either shape.
 */
export default function dynamic(loader) {
  let resolved = null

  return function Dynamic(props) {
    const [Comp, setComp] = useState(() => resolved)

    useEffect(() => {
      if (resolved) return
      let alive = true
      Promise.resolve(loader()).then((mod) => {
        resolved = mod?.default ?? mod
        if (alive) setComp(() => resolved)
      })
      return () => {
        alive = false
      }
    }, [])

    return Comp ? createElement(Comp, props) : null
  }
}
