import type { Language } from '../store/languageStore'

interface Props {
  languages: Language[]
  value: string
  onChange: (code: string) => void
}

export function LanguageSelector({ languages, value, onChange }: Props) {
  return (
    <div className="relative">
      <label className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block mb-1 text-right">
        Translate to
      </label>
      <select
        id="language-selector"
        className="
          appearance-none bg-slate-800/80 text-white rounded-xl px-3 py-2 pr-8 text-sm
          border border-slate-600/50 cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
          transition-all duration-200
          hover:bg-slate-700/80 hover:border-slate-500/50
        "
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.displayName}
          </option>
        ))}
      </select>
      {/* Custom dropdown arrow */}
      <svg
        className="absolute right-2 bottom-[10px] w-4 h-4 text-slate-400 pointer-events-none"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  )
}
