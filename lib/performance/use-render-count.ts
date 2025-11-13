import { useRef, useEffect } from 'react'

/**
 * Development hook to track component render counts
 * Use this to identify components that re-render unnecessarily
 */
export function useRenderCount(componentName: string) {
  const renderCount = useRef(0)
  const isDev = process.env.NODE_ENV === 'development'

  useEffect(() => {
    if (isDev) {
      renderCount.current += 1
      console.log(`[Render] ${componentName}: ${renderCount.current}`)
    }
  })

  return isDev ? renderCount.current : 0
}

/**
 * Hook to track why a component re-rendered
 * Logs which props/state values changed
 */
export function useWhyDidYouUpdate(componentName: string, props: Record<string, any>) {
  const previousProps = useRef<Record<string, any>>({})
  const isDev = process.env.NODE_ENV === 'development'

  useEffect(() => {
    if (isDev && previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props })
      const changedProps: Record<string, { from: any; to: any }> = {}

      allKeys.forEach((key) => {
        if (previousProps.current[key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current[key],
            to: props[key]
          }
        }
      })

      if (Object.keys(changedProps).length > 0) {
        console.log(`[WhyDidYouUpdate] ${componentName}:`, changedProps)
      }
    }

    previousProps.current = props
  })
}

