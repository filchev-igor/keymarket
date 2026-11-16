import { useEffect, useState, type RefObject } from 'react'

/**
 * How many columns the CSS grid in `ref` currently has, i.e. how many items fit in one row at this width.
 * It reads the browser's own resolved `grid-template-columns`, so it always matches the stylesheet and follows
 * window resizes (the observer also fires once as soon as it starts watching, so no state is set up front).
 */
export const useColumns = (ref: RefObject<HTMLElement | null>, fallback = 5) => {
  const [columns, setColumns] = useState(fallback)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(() => {
      const tracks = getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length
      if (tracks > 0) setColumns(tracks)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return columns
}
