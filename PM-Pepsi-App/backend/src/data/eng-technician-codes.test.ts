import { describe, expect, it } from 'vitest'
import {
  engTechnicianDisplayName,
  formatWorkcenterFilterLabel,
} from './eng-technician-codes.js'

describe('engTechnicianDisplayName', () => {
  it('includes title + name + surname from row', () => {
    expect(
      engTechnicianDisplayName({
        wkctr: 'PAC009',
        titlewkctr: 'นาย',
        namewkctr: 'อนุวัฒน์',
        surnamewkctr: 'จันทร์ดี',
      }),
    ).toBe('นาย อนุวัฒน์ จันทร์ดี')
  })

  it('falls back to catalog when DB name fields are empty', () => {
    expect(engTechnicianDisplayName({ wkctr: 'PAC009' })).toBe('นาย อนุวัฒน์ จันทร์ดี')
  })
})

describe('formatWorkcenterFilterLabel', () => {
  it('joins code and Thai name', () => {
    expect(formatWorkcenterFilterLabel('PAC009', 'นาย อนุวัฒน์ จันทร์ดี')).toBe(
      'PAC009 — นาย อนุวัฒน์ จันทร์ดี',
    )
  })

  it('returns code only when name missing', () => {
    expect(formatWorkcenterFilterLabel('PAC999', '')).toBe('PAC999')
  })
})
