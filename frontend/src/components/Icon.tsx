/**
 * Small line icons drawn for this project (no third-party artwork or brand logos).
 * They inherit the text colour; the size comes from the CSS around them.
 */
export type IconName =
  | 'grid'
  | 'flame'
  | 'tag'
  | 'coins'
  | 'monitor'
  | 'gamepad'
  | 'handheld'
  | 'globe'
  | 'key'
  | 'bolt'
  | 'search'
  | 'menu'

const common = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

export default function Icon({ name }: { name: IconName }) {
  switch (name) {
    case 'grid':
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="7" height="7" />
          <rect x="13.5" y="3.5" width="7" height="7" />
          <rect x="3.5" y="13.5" width="7" height="7" />
          <rect x="13.5" y="13.5" width="7" height="7" />
        </svg>
      )
    case 'flame':
      return (
        <svg {...common}>
          <path d="M12 3c.8 3 4.2 4.6 4.2 9a4.2 4.2 0 0 1-8.4 0c0-2 1-3.2 2.2-4.2.1 1.6.8 2.4 1.8 2.4C12.4 7.6 11.4 5.8 12 3z" />
        </svg>
      )
    case 'tag':
      return (
        <svg {...common}>
          <path d="M3.5 12.5v-8h8l9 9-8 8-9-9z" />
          <circle cx="8" cy="9" r="1.2" />
        </svg>
      )
    case 'coins':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M15 9.2a3.6 3.6 0 1 0 0 5.6M8 11h5.5M8 13h5.5" />
        </svg>
      )
    case 'monitor':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="12" />
          <path d="M8 20h8M12 16v4" />
        </svg>
      )
    case 'handheld':
      return (
        <svg {...common}>
          <rect x="2.5" y="7" width="19" height="10" rx="2" />
          <path d="M6.5 10v4M4.5 12h4" />
          <circle cx="16.5" cy="11" r="1" />
          <circle cx="18.7" cy="13.2" r="1" />
        </svg>
      )
    case 'globe':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18" />
        </svg>
      )
    case 'key':
      return (
        <svg {...common}>
          <circle cx="8" cy="15" r="4" />
          <path d="M10.8 12.2 20 3M16 7l3 3M14 9l2 2" />
        </svg>
      )
    case 'search':
      return (
        <svg {...common} strokeWidth={1.5}>
          <circle cx="10.5" cy="10.5" r="8" />
          <path d="m16.5 16.5 5.5 5.5" />
        </svg>
      )
    case 'menu':
      return (
        <svg {...common}>
          <path d="M4 6.5h16M4 12h16M4 17.5h16" />
        </svg>
      )
    case 'bolt':
      return (
        <svg {...common}>
          <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
        </svg>
      )
    default: // gamepad
      return (
        <svg {...common}>
          <path d="M6.5 8.5h11a4 4 0 0 1 4 4v1a3 3 0 0 1-5 2.2L15 14h-6l-1.5 1.7a3 3 0 0 1-5-2.2v-1a4 4 0 0 1 4-4z" />
          <path d="M8 10.8v3M6.5 12.3h3" />
          <circle cx="15.5" cy="11.2" r="0.9" />
          <circle cx="17.7" cy="13" r="0.9" />
        </svg>
      )
  }
}

/** Which icon stands for a platform (generic shapes, not the platforms' logos). */
export function platformIcon(platform: string): IconName {
  if (/steam|epic|pc/i.test(platform)) return 'monitor'
  if (/nintendo/i.test(platform)) return 'handheld'
  return 'gamepad'
}
