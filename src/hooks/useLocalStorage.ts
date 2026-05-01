import { useState, useCallback } from 'react'

export function useLocalStorage<T>(
  key: string,
  initial: T,
): [T, (val: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item !== null ? (JSON.parse(item) as T) : initial
    } catch {
      return initial
    }
  })

  const setValue = useCallback(
    (val: T | ((prev: T) => T)) => {
      setState(prev => {
        const next = typeof val === 'function' ? (val as (p: T) => T)(prev) : val
        try {
          window.localStorage.setItem(key, JSON.stringify(next))
        } catch {
          // storage full or unavailable
        }
        return next
      })
    },
    [key],
  )

  return [state, setValue]
}
