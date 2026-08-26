import { useEffect, useRef } from 'react'

export default function CustomCursor() {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const pos   = useRef({ x: -100, y: -100 })
  const smooth = useRef({ x: -100, y: -100 })
  const raf   = useRef<number>(0)
  const large = useRef(false)

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return

    document.documentElement.style.cursor = 'none'

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY }
    }

    const onEnter = () => {
      large.current = true
      outer.current?.classList.add('cursor-large')
      inner.current?.classList.add('cursor-large')
    }

    const onLeave = () => {
      large.current = false
      outer.current?.classList.remove('cursor-large')
      inner.current?.classList.remove('cursor-large')
    }

    const onDown = () => outer.current?.classList.add('cursor-press')
    const onUp = () => outer.current?.classList.remove('cursor-press')

    const bindHoverTargets = () => {
      document.querySelectorAll('a, button, [data-cursor="hover"]').forEach(el => {
        el.addEventListener('mouseenter', onEnter)
        el.addEventListener('mouseleave', onLeave)
      })
    }

    // re-bind on DOM mutations (dynamic content)
    const observer = new MutationObserver(bindHoverTargets)
    observer.observe(document.body, { childList: true, subtree: true })
    bindHoverTargets()

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('mouseup', onUp)

    const tick = () => {
      smooth.current.x += (pos.current.x - smooth.current.x) * 0.14
      smooth.current.y += (pos.current.y - smooth.current.y) * 0.14

      if (outer.current) {
        outer.current.style.transform = `translate(${smooth.current.x}px, ${smooth.current.y}px)`
      }
      if (inner.current) {
        inner.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px)`
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)

    return () => {
      document.documentElement.style.cursor = ''
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('mouseup', onUp)
      cancelAnimationFrame(raf.current)
      observer.disconnect()
    }
  }, [])

  return (
    <>
      {/* Slow-following ring */}
      <div ref={outer} className="cursor-outer" aria-hidden />
      {/* Instant dot */}
      <div ref={inner} className="cursor-inner" aria-hidden />
    </>
  )
}
