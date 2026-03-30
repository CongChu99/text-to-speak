import { useEffect, useRef } from 'react'
import type { Utterance } from '../store/sessionStore'
import { ConversationBubble } from './ConversationBubble'

interface Props {
  utterances: Utterance[]
}

export function TranscriptPanel({ utterances }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (bottomRef.current?.scrollIntoView) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [utterances])

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
      {utterances.length === 0 ? (
        <p className="text-slate-500 text-sm text-center mt-8">
          Conversation will appear here
        </p>
      ) : (
        utterances.map((u) => <ConversationBubble key={u.id} utterance={u} />)
      )}
      <div ref={bottomRef} />
    </div>
  )
}
