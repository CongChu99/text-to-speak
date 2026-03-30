import type { CSSProperties } from 'react'
import type { Utterance } from '../store/sessionStore'

interface Props {
  utterance: Utterance
  style?: CSSProperties
}

export function ConversationBubble({ utterance, style }: Props) {
  const { speaker, sourceText, translatedText } = utterance
  const isA = speaker === 'A'
  const isTranslating = translatedText === '…'

  return (
    <div
      className={`flex flex-col gap-1 animate-float-in ${isA ? 'items-start' : 'items-end'}`}
      data-speaker={speaker}
      style={style}
    >
      <span className="text-[10px] text-slate-500 px-1 font-medium uppercase tracking-wider">
        Speaker {speaker}
      </span>
      <div
        className={`
          max-w-[85%] rounded-2xl px-4 py-3 shadow-lg
          ${isA
            ? 'bg-gradient-to-br from-blue-600 to-blue-700 rounded-tl-sm shadow-blue-900/20'
            : 'bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-tr-sm shadow-emerald-900/20'
          }
        `}
      >
        <p className="text-white font-medium text-sm leading-relaxed">{sourceText}</p>
        {translatedText && (
          <div className="mt-2 pt-2 border-t border-white/10">
            {isTranslating ? (
              <div className="dot-pulse flex gap-1.5 text-white/60">
                <span /><span /><span />
              </div>
            ) : (
              <p className="text-white/75 text-xs leading-relaxed">{translatedText}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
