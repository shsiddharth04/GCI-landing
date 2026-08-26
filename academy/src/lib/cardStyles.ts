import type { CSSProperties } from 'react'

export const cardBase: CSSProperties = {
  background: '#0f0d18',
  border: '1px solid rgba(226,169,241,0.1)',
  position: 'relative',
  overflow: 'hidden',
  transition: 'background 0.2s',
}

export const cardHoverBg = '#130f1e'
export const cardRestBg = '#0f0d18'

export const cardHairline: CSSProperties = {
  position: 'absolute',
  top: 0, left: 0, right: 0,
  height: '1px',
  background: 'linear-gradient(90deg, transparent, rgba(226,169,241,0.5), transparent)',
  transition: 'opacity 0.2s',
}

export const cardHairlineHover: CSSProperties = {
  ...cardHairline,
  background: 'linear-gradient(90deg, transparent, rgba(226,169,241,0.85), transparent)',
}

export function onCardEnter(el: HTMLElement) {
  el.style.background = cardHoverBg
}

export function onCardLeave(el: HTMLElement, highlighted = false) {
  el.style.background = highlighted ? cardHoverBg : cardRestBg
}
