import { useState, useRef, useCallback } from 'react'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·'

export function useScramble(original: string, speed = 28) {
  const [display, setDisplay] = useState(original)
  const frame = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scramble = useCallback(() => {
    if (frame.current) clearTimeout(frame.current)
    let iterations = 0

    const tick = () => {
      setDisplay(
        original.split('').map((char, i) => {
          if (char === ' ') return ' '
          if (i < iterations) return original[i]
          return CHARS[Math.floor(Math.random() * CHARS.length)]
        }).join('')
      )
      if (iterations < original.length) {
        iterations += 0.5
        frame.current = setTimeout(tick, speed)
      } else {
        setDisplay(original)
      }
    }
    tick()
  }, [original, speed])

  const reset = useCallback(() => {
    if (frame.current) clearTimeout(frame.current)
    setDisplay(original)
  }, [original])

  return { display, scramble, reset }
}
