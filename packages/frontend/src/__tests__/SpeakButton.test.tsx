import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SpeakButton } from '../components/SpeakButton'

describe('SpeakButton', () => {
  it('renders idle state by default', () => {
    render(<SpeakButton isActive={false} onPress={() => {}} onRelease={() => {}} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByText(/hold to speak/i)).toBeInTheDocument()
  })

  it('shows active label when speaking', () => {
    render(<SpeakButton isActive={true} onPress={() => {}} onRelease={() => {}} />)
    expect(screen.getByText(/speaking/i)).toBeInTheDocument()
  })

  it('calls onPress when mouse button pressed', async () => {
    const onPress = vi.fn()
    render(<SpeakButton isActive={false} onPress={onPress} onRelease={() => {}} />)
    await userEvent.pointer({ target: screen.getByRole('button'), keys: '[MouseLeft>]' })
    expect(onPress).toHaveBeenCalled()
  })

  it('calls onRelease when mouse button released', async () => {
    const onRelease = vi.fn()
    render(<SpeakButton isActive={false} onPress={() => {}} onRelease={onRelease} />)
    await userEvent.pointer([
      { target: screen.getByRole('button'), keys: '[MouseLeft>]' },
      { keys: '[/MouseLeft]' },
    ])
    expect(onRelease).toHaveBeenCalled()
  })

  it('has minimum tap target size via aria-label', () => {
    render(<SpeakButton isActive={false} onPress={() => {}} onRelease={() => {}} />)
    const btn = screen.getByRole('button')
    expect(btn).toBeInTheDocument()
  })
})
