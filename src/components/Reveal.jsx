import { useScrollReveal } from '../hooks/useScrollReveal'

// Wraps any block so it fades/slides in the first time it scrolls into
// view, instead of everything below the fold already being fully animated
// by the time a visitor actually scrolls to it. `delay` staggers a group
// of siblings (e.g. cards in a grid) without needing separate observers.
export function Reveal({ as: Tag = 'div', delay = 0, className = '', style, children, ...props }) {
  const [ref, visible] = useScrollReveal()

  return (
    <Tag
      ref={ref}
      className={`scroll-reveal${visible ? ' is-visible' : ''}${className ? ` ${className}` : ''}`}
      style={{ ...style, transitionDelay: visible && delay ? `${delay}ms` : '0ms' }}
      {...props}
    >
      {children}
    </Tag>
  )
}
