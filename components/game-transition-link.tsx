'use client'

import Link, { type LinkProps } from 'next/link'
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react'

export const GAME_NAVIGATE_EVENT = 'game:navigate'

type GameTransitionLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children: ReactNode
  }

export function GameTransitionLink({
  children,
  href,
  onClick,
  ...props
}: GameTransitionLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      props.target === '_blank'
    ) {
      return
    }

    event.preventDefault()
    window.dispatchEvent(
      new CustomEvent(GAME_NAVIGATE_EVENT, {
        detail: { href: typeof href === 'string' ? href : href.pathname ?? '/' },
      }),
    )
  }

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  )
}

