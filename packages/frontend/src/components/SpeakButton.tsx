interface Props {
  isActive: boolean
  isDisabled: boolean
  onPress: () => void
  onRelease: () => void
}

export function SpeakButton({ isActive, isDisabled, onPress, onRelease }: Props) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Pulse rings when active */}
      {isActive && (
        <>
          <div className="absolute w-24 h-24 rounded-full border-2 border-blue-400/30 animate-pulse-ring" />
          <div className="absolute w-24 h-24 rounded-full border-2 border-blue-400/20 animate-pulse-ring" style={{ animationDelay: '0.5s' }} />
        </>
      )}

      <button
        className={`
          relative z-10 w-[72px] h-[72px] rounded-full flex flex-col items-center justify-center
          select-none touch-none transition-all duration-200 ease-out
          ${isDisabled
            ? 'bg-slate-800 cursor-not-allowed opacity-50'
            : isActive
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 scale-90 shadow-[0_0_40px_rgba(59,130,246,0.5)]'
              : 'bg-gradient-to-br from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 hover:scale-105 shadow-lg shadow-black/30 active:scale-95'
          }
        `}
        aria-label={isActive ? 'Speaking — release to stop' : 'Hold to speak'}
        disabled={isDisabled}
        onMouseDown={() => !isDisabled && onPress()}
        onMouseUp={() => !isDisabled && onRelease()}
        onMouseLeave={() => isActive && onRelease()}
        onTouchStart={(e) => { e.preventDefault(); if (!isDisabled) onPress() }}
        onTouchEnd={(e) => { e.preventDefault(); if (!isDisabled) onRelease() }}
      >
        <MicIcon isActive={isActive} />
      </button>
    </div>
  )
}

function MicIcon({ isActive }: { isActive: boolean }) {
  return (
    <svg
      className={`w-7 h-7 transition-colors duration-200 ${
        isActive ? 'text-white' : 'text-slate-300'
      }`}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
    </svg>
  )
}
