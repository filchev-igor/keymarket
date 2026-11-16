/**
 * Small line icons drawn for this project (no third-party artwork or brand logos).
 * They inherit the text colour and are sized by the --category-icon variable via CSS.
 */
export type IconName = 'grid' | 'flame' | 'tag' | 'coins' | 'monitor' | 'gamepad' | 'handheld'

const common = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const

export default function CategoryIcon({ name }: { name: IconName }) {
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
