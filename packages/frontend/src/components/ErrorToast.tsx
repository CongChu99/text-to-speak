interface Props {
  message: string
  onDismiss: () => void
}

export function ErrorToast({ message, onDismiss }: Props) {
  return (
    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="
        flex items-center gap-3 px-4 py-3 rounded-xl
        bg-red-500/10 border border-red-500/20 backdrop-blur-lg
        shadow-lg shadow-red-900/10 max-w-sm
      ">
        <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <p className="text-red-200 text-sm flex-1">{message}</p>
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-300 transition-colors p-1"
          aria-label="Dismiss error"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
