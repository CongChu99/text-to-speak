interface Props {
  isActive: boolean
  onPress: () => void
  onRelease: () => void
}

export function SpeakButton({ isActive, onPress, onRelease }: Props) {
  return (
    <button
      className={`
        w-20 h-20 rounded-full flex flex-col items-center justify-center
        select-none touch-none transition-all duration-150
        ${isActive
          ? 'bg-blue-500 scale-95 shadow-lg shadow-blue-500/50'
          : 'bg-slate-700 hover:bg-slate-600 shadow-md'
        }
      `}
      aria-label={isActive ? 'Speaking' : 'Hold to speak'}
      onMouseDown={onPress}
      onMouseUp={onRelease}
      onMouseLeave={() => isActive && onRelease()}
      onTouchStart={(e) => { e.preventDefault(); onPress() }}
      onTouchEnd={(e) => { e.preventDefault(); onRelease() }}
    >
      <MicIcon isActive={isActive} />
      <span className="text-white text-xs mt-1 font-medium">
        {isActive ? 'Speaking' : 'Hold to speak'}
      </span>
    </button>
  )
}

function MicIcon({ isActive }: { isActive: boolean }) {
  return (
    <svg
      className={`w-8 h-8 ${isActive ? 'text-white animate-pulse' : 'text-slate-300'}`}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
    </svg>
  )
}
