import { describe, expect, it } from 'vitest'
import { sidebarWidthClasses } from '@/lib/sidebar-prefs'

describe('sidebar-prefs', () => {
  it('maps width classes for narrow and wide', () => {
    expect(sidebarWidthClasses('narrow')).toEqual({
      expanded: 'w-60',
      collapsed: 'w-[4.25rem]',
      drawer: 'w-[min(100vw,18rem)] max-w-[min(100vw,18rem)]',
    })
    expect(sidebarWidthClasses('wide').expanded).toBe('w-64')
    expect(sidebarWidthClasses('wide').drawer).toContain('20rem')
  })
})
