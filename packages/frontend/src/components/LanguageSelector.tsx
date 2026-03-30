import type { Language } from '../store/languageStore'

interface Props {
  languages: Language[]
  value: string
  onChange: (code: string) => void
}

export function LanguageSelector({ languages, value, onChange }: Props) {
  return (
    <select
      className="bg-slate-800 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.displayName}
        </option>
      ))}
    </select>
  )
}
