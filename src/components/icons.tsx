// Thin line icons (1.6 stroke), sized by the parent's font-size
type P = { size?: number; className?: string }

const Svg = ({ size = 20, className, children }: P & { children: React.ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}
    strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {children}
  </svg>
)

export const BagIcon = (p: P) => <Svg {...p}><path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></Svg>
export const SearchIcon = (p: P) => <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Svg>
export const MenuIcon = (p: P) => <Svg {...p}><path d="M4 8h16M4 16h16" /></Svg>
export const CloseIcon = (p: P) => <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>
export const PlusIcon = (p: P) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
export const MinusIcon = (p: P) => <Svg {...p}><path d="M5 12h14" /></Svg>
export const CheckIcon = (p: P) => <Svg {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></Svg>
export const ArrowIcon = (p: P) => <Svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>
export const TrashIcon = (p: P) => <Svg {...p}><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" /></Svg>
export const FilterIcon = (p: P) => <Svg {...p}><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></Svg>
export const TruckIcon = (p: P) => <Svg {...p}><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="1.6" /><circle cx="17" cy="18" r="1.6" /></Svg>
export const ShieldIcon = (p: P) => <Svg {...p}><path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></Svg>
export const ChatIcon = (p: P) => <Svg {...p}><path d="M4 18.5 5.3 15A7.5 7.5 0 1 1 8.5 18L4 18.5Z" /></Svg>
export const WalletIcon = (p: P) => <Svg {...p}><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M16 12.5h2M3 9h18" /></Svg>
export const ChevronIcon = (p: P) => <Svg {...p}><path d="m9 6 6 6-6 6" /></Svg>

export const StarIcon = ({ size = 14, filled = 1 }: { size?: number; filled?: number }) => {
  const id = `s${Math.round(filled * 100)}`
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id={id}>
          <stop offset={`${filled * 100}%`} stopColor="var(--gold)" />
          <stop offset={`${filled * 100}%`} stopColor="#e8e8ed" />
        </linearGradient>
      </defs>
      <path fill={`url(#${id})`} d="m12 2.8 2.8 5.9 6.4.8-4.7 4.5 1.2 6.4L12 17.3l-5.7 3.1 1.2-6.4-4.7-4.5 6.4-.8L12 2.8Z" />
    </svg>
  )
}
