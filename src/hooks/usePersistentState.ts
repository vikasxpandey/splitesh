import { useEffect, useState } from 'react'

type Serializer<T> = (value: T) => string
type Deserializer<T> = (value: string) => T

type Options<T> = {
  serializer?: Serializer<T>
  deserializer?: Deserializer<T>
}

const isBrowser = typeof window !== 'undefined'

export function usePersistentState<T>(
  key: string,
  initialValue: T | (() => T),
  options: Options<T> = {},
) {
  const { serializer = JSON.stringify, deserializer = JSON.parse } = options

  const readValue = () => {
    if (!isBrowser) return resolveInitial(initialValue)
    const stored = window.localStorage.getItem(key)
    if (!stored) return resolveInitial(initialValue)
    try {
      return deserializer(stored) as T
    } catch (error) {
      console.warn(`usePersistentState: Failed to parse localStorage value for key "${key}"`, error)
      return resolveInitial(initialValue)
    }
  }

  const [state, setState] = useState<T>(readValue)

  useEffect(() => {
    if (!isBrowser) return
    try {
      window.localStorage.setItem(key, serializer(state))
    } catch (error) {
      console.warn(`usePersistentState: Failed to set localStorage value for key "${key}"`, error)
    }
  }, [key, serializer, state])

  return [state, setState] as const
}

function resolveInitial<T>(value: T | (() => T)): T {
  return typeof value === 'function' ? (value as () => T)() : value
}

