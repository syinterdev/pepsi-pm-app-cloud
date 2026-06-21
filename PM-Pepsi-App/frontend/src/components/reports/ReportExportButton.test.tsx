/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import '@/i18n'
import { i18n } from '@/i18n'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ReportExportButton } from './ReportExportButton'

describe('ReportExportButton', () => {
  it('shows Thai CSV label and download icon', async () => {
    await i18n.changeLanguage('th')
    render(<ReportExportButton format="csv" />)
    expect(screen.getByRole('button', { name: /ดาวน์โหลด CSV/i })).toBeInTheDocument()
  })

  it('shows loading label when busy', () => {
    render(<ReportExportButton format="xlsx" loading loadingLabel="กำลังส่งออก…" />)
    expect(screen.getByRole('button', { name: /กำลังส่งออก/i })).toBeDisabled()
  })
})
