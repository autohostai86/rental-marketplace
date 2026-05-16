export default function Logo({ className = 'h-8 w-auto' }: { className?: string }) {
  return (
    <svg viewBox="0 0 500 120" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="45" cy="60" r="28" fill="none" stroke="#000000" strokeWidth="5" strokeLinecap="round" />
      <circle cx="75" cy="60" r="28" fill="none" stroke="#000000" strokeWidth="5" strokeLinecap="round" />
      <text
        x="130"
        y="95"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontSize="90"
        fontWeight="900"
        fill="#000000"
        letterSpacing="-2"
      >
        BORRO
      </text>
    </svg>
  )
}
