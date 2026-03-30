import type { Utterance } from '../store/sessionStore'

interface Props {
  utterance: Utterance
}

export function ConversationBubble({ utterance }: Props) {
  const { speaker, sourceText, translatedText } = utterance
  const isA = speaker === 'A'

  return (
    <div
      className={`flex flex-col gap-1 ${isA ? 'items-start' : 'items-end'}`}
      data-speaker={speaker}
    >
      <span className="text-xs text-slate-400 px-1">
        Speaker {speaker}
      </span>
      <div
        className={`
          max-w-[80%] rounded-2xl px-4 py-3
          ${isA ? 'bg-blue-500 rounded-tl-sm' : 'bg-green-500 rounded-tr-sm'}
        `}
      >
        <p className="text-white font-medium text-sm">{sourceText}</p>
        <p className="text-white/80 text-xs mt-1 italic">{translatedText}</p>
      </div>
    </div>
  )
}
