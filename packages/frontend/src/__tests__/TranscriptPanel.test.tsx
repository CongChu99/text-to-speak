import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TranscriptPanel } from '../components/TranscriptPanel'
import type { Utterance } from '../store/sessionStore'

const utterances: Utterance[] = [
  {
    id: '1',
    speaker: 'A',
    sourceText: 'Hello',
    translatedText: 'Xin chào',
    sourceLang: 'en',
    targetLang: 'vi',
  },
  {
    id: '2',
    speaker: 'B',
    sourceText: 'Cảm ơn',
    translatedText: 'Thank you',
    sourceLang: 'vi',
    targetLang: 'en',
  },
]

describe('TranscriptPanel', () => {
  it('renders empty state when no utterances', () => {
    render(<TranscriptPanel utterances={[]} />)
    expect(screen.getByText(/conversation will appear here/i)).toBeInTheDocument()
  })

  it('renders all utterances', () => {
    render(<TranscriptPanel utterances={utterances} />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('Xin chào')).toBeInTheDocument()
    expect(screen.getByText('Cảm ơn')).toBeInTheDocument()
    expect(screen.getByText('Thank you')).toBeInTheDocument()
  })

  it('shows speaker labels', () => {
    render(<TranscriptPanel utterances={utterances} />)
    expect(screen.getByText(/speaker a/i)).toBeInTheDocument()
    expect(screen.getByText(/speaker b/i)).toBeInTheDocument()
  })
})
