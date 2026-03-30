import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageSelector } from '../components/LanguageSelector'

const languages = [
  { code: 'en', displayName: 'English', sttSupported: true, ttsSupported: true },
  { code: 'vi', displayName: 'Vietnamese', sttSupported: true, ttsSupported: true },
  { code: 'ja', displayName: 'Japanese', sttSupported: true, ttsSupported: true },
]

describe('LanguageSelector', () => {
  it('renders selected language', () => {
    render(
      <LanguageSelector
        languages={languages}
        value="vi"
        onChange={() => {}}
      />
    )
    expect(screen.getByText('Vietnamese')).toBeInTheDocument()
  })

  it('calls onChange when a language is selected', async () => {
    const onChange = vi.fn()
    render(
      <LanguageSelector
        languages={languages}
        value="en"
        onChange={onChange}
      />
    )
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.selectOptions(screen.getByRole('combobox'), 'vi')
    expect(onChange).toHaveBeenCalledWith('vi')
  })

  it('renders all language options', async () => {
    render(
      <LanguageSelector
        languages={languages}
        value="en"
        onChange={() => {}}
      />
    )
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(3)
  })
})
