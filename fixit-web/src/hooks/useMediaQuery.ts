import { useState, useEffect } from 'react'
import { breakpoints } from '../utils/breakpoints'

/**
 * React hook that listens for window resize and returns whether the viewport
 * matches the given breakpoint (min-width query).
 *
 * @param breakpointKey - The breakpoint key to check against
 * @returns true if viewport width >= breakpoint width
 *
 * @example
 * const isDesktop = useMediaQuery('lg') // true on screens >= 1024px
 * const isMobile = !useMediaQuery('md') // true on screens < 768px
 */
export function useMediaQuery(breakpointKey: keyof typeof breakpoints): boolean {
  const breakpoint = breakpoints[breakpointKey]

  // 初始化时使用正确的值，避免在 effect 中 setState
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    const query = window.matchMedia(`(min-width: ${breakpoint})`)
    return query.matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const query = window.matchMedia(`(min-width: ${breakpoint})`)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    query.addEventListener('change', handler)

    return () => query.removeEventListener('change', handler)
  }, [breakpoint])

  return matches
}

/**
 * Convenience hook that returns true on mobile devices (< 768px)
 * @returns true if viewport width < 768px
 */
export function useIsMobile(): boolean {
  return !useMediaQuery('md')
}
