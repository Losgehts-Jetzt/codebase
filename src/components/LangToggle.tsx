import type { Lang } from '../types'

interface LangToggleProps {
  lang: Lang
  onChange: (lang: Lang) => void
}

export function LangToggle({ lang, onChange }: LangToggleProps) {
  return (
    <div className="flex rounded-full border-2 border-indigo-200 overflow-hidden text-sm font-bold">
      <button
        onClick={() => onChange('de')}
        className={`px-3 py-1.5 min-h-[36px] transition-colors ${
          lang === 'de'
            ? 'bg-indigo-600 text-white'
            : 'bg-white text-indigo-500 active:bg-indigo-50'
        }`}
      >
        DE
      </button>
      <button
        onClick={() => onChange('en')}
        className={`px-3 py-1.5 min-h-[36px] transition-colors ${
          lang === 'en'
            ? 'bg-indigo-600 text-white'
            : 'bg-white text-indigo-500 active:bg-indigo-50'
        }`}
      >
        EN
      </button>
    </div>
  )
}
