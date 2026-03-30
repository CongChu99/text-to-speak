import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConversationBubble } from '../components/ConversationBubble'
import type { Utterance } from '../store/sessionStore'

const utteranceA: Utterance = {
  id: '1',
  speaker: 'A',
  sourceText: 'Hello',
  translatedText: 'Xin chào',
  sourceLang: 'en',
  targetLang: 'vi',
}

const utteranceB: Utterance = {
  id: '2',
  speaker: 'B',
  sourceText: 'Cảm ơn',
  translatedText: 'Thank you',
  sourceLang: 'vi',
  targetLang: 'en',
}

describe('ConversationBubble', () => {
  it('renders source and translated text', () => {
    render(<ConversationBubble utterance={utteranceA} />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('Xin chào')).toBeInTheDocument()
  })

  it('shows speaker A label', () => {
    render(<ConversationBubble utterance={utteranceA} />)
    expect(screen.getByText(/speaker a/i)).toBeInTheDocument()
  })

  it('shows speaker B label', () => {
    render(<ConversationBubble utterance={utteranceB} />)
    expect(screen.getByText(/speaker b/i)).toBeInTheDocument()
  })

  it('applies blue style for speaker A', () => {
    const { container } = render(<ConversationBubble utterance={utteranceA} />)
    // blue bubble for speaker A
    expect(container.querySelector('[data-speaker="A"]')).toBeInTheDocument()
  })

  it('applies green style for speaker B', () => {
    const { container } = render(<ConversationBubble utterance={utteranceB} />)
    expect(container.querySelector('[data-speaker="B"]')).toBeInTheDocument()
  })
})
